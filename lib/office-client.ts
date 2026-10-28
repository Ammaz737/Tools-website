"use client";

import { jsPDF } from "jspdf";

async function canvasToPngDataUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL("image/png");
}

function createOffscreenHost() {
  const host = document.createElement("div");
  host.style.cssText = [
    "position:fixed",
    "left:-16000px",
    "top:0",
    "width:816px",
    "background:#ffffff",
    "color:#111111",
    "z-index:-1",
    "overflow:visible",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(host);
  return host;
}

/**
 * docx-preview's renderAsync clears its container's innerHTML before
 * rendering (`bodyContainer.innerHTML = ""`), so any override <style> placed
 * inside that container is wiped before it ever applies. Inject overrides
 * into <head> instead, where they survive, and return a cleanup function.
 */
function injectDocxOverrideStyle(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    .docx-wrapper {
      background: #ffffff !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .docx-wrapper > section.docx,
    section.docx {
      box-shadow: none !important;
      margin: 0 0 24px 0 !important;
      background: #ffffff !important;
      /* Font-substitution in the browser can render text a few px wider
         than Word did. Never clip it — an occasional sliver of overflow
         beyond the page margin is far better than silently losing text. */
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);
  return () => style.remove();
}

/**
 * Capture each rendered page onto its own PDF page with matching dimensions.
 * No vertical slicing — avoids grey-bar / cut-off artifacts.
 */
async function capturePagesToPdfExact(elements: HTMLElement[]): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const pxToPt = 72 / 96;

  async function renderPage(el: HTMLElement) {
    const previous = {
      background: el.style.background,
      boxShadow: el.style.boxShadow,
      margin: el.style.margin,
    };
    el.style.background = "#ffffff";
    el.style.boxShadow = "none";
    el.style.margin = "0";

    try {
      // `windowWidth`/`windowHeight` only size html2canvas's virtual layout
      // viewport — the output canvas itself defaults to the element's own
      // box and would still crop anything sitting in `overflow: visible`
      // space. Pass explicit `width`/`height` so overflowed content (e.g.
      // font-substitution making a line a few px wider than Word's) is
      // actually captured instead of silently cut off.
      const width = Math.max(el.scrollWidth, el.clientWidth, 1);
      const height = Math.max(el.scrollHeight, el.clientHeight, 1);
      return await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
      });
    } finally {
      el.style.background = previous.background;
      el.style.boxShadow = previous.boxShadow;
      el.style.margin = previous.margin;
    }
  }

  const firstCanvas = await renderPage(elements[0]);
  const firstWpt = (firstCanvas.width / 2) * pxToPt;
  const firstHpt = (firstCanvas.height / 2) * pxToPt;

  const pdf = new jsPDF({
    orientation: firstWpt > firstHpt ? "landscape" : "portrait",
    unit: "pt",
    format: [firstWpt, firstHpt],
    compress: true,
  });

  pdf.addImage(
    await canvasToPngDataUrl(firstCanvas),
    "PNG",
    0,
    0,
    pdf.internal.pageSize.getWidth(),
    pdf.internal.pageSize.getHeight(),
  );

  for (let i = 1; i < elements.length; i += 1) {
    const canvas = await renderPage(elements[i]);
    const wpt = (canvas.width / 2) * pxToPt;
    const hpt = (canvas.height / 2) * pxToPt;
    pdf.addPage([wpt, hpt], wpt > hpt ? "l" : "p");
    pdf.addImage(
      await canvasToPngDataUrl(canvas),
      "PNG",
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      pdf.internal.pageSize.getHeight(),
    );
  }

  return pdf.output("blob");
}

/** DOCX → PDF with visual layout via docx-preview + per-page canvas capture. */
export async function convertDocxToPdf(
  file: File,
  onProgress?: (message: string) => void,
): Promise<Blob> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "doc") {
    throw new Error(
      "Legacy .doc is not supported in-browser. Save as .docx in Word, then convert.",
    );
  }

  if (file.size > 40 * 1024 * 1024) {
    throw new Error("DOCX is larger than 40MB. Split the document or compress images first.");
  }

  onProgress?.("Rendering Word document…");
  const { renderAsync } = await import("docx-preview");
  const host = createOffscreenHost();
  const removeOverrideStyle = injectDocxOverrideStyle();

  try {
    const buffer = await file.arrayBuffer();
    await renderAsync(buffer, host, undefined, {
      // docx-preview names its rendered wrapper/section elements after this
      // option (defaults to "docx"). The selectors below expect that default
      // — overriding it here would make every page-lookup silently fail.
      className: "docx",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      // Word's embedded "last rendered page break" hints are only as
      // reliable as the last app that saved the file — when they're stale
      // or missing, trusting them (false) collapses the whole document into
      // one giant unpaginated section. Let docx-preview compute page breaks
      // itself instead (the library default).
      ignoreLastRenderedPageBreak: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      useBase64URL: true,
      experimental: true,
    });

    // Allow fonts/layout to settle.
    await new Promise((resolve) => window.setTimeout(resolve, 150));

    let pages = Array.from(
      host.querySelectorAll<HTMLElement>("section.docx"),
    );

    // Fallback selectors used by some docx-preview versions.
    if (pages.length === 0) {
      pages = Array.from(
        host.querySelectorAll<HTMLElement>(".docx-wrapper > section, .docx-wrapper > article"),
      );
    }

    if (pages.length === 0) {
      const wrapper = host.querySelector<HTMLElement>(".docx-wrapper");
      if (wrapper) pages = [wrapper];
    }

    if (pages.length === 0) {
      throw new Error("Could not render Word pages for conversion");
    }

    // docx-preview renders anchored drawings as inline blocks. For a page
    // consisting solely of one full-page image, that adds a text baseline
    // below the image and enlarges the captured PDF page. Normalize this
    // specific layout; never flatten pages with other text or graphics.
    for (const page of pages) {
      const images = page.querySelectorAll<HTMLImageElement>("img");
      if (images.length !== 1 || page.textContent?.trim()) continue;
      const image = images[0];
      await image.decode();
      const bounds = image.getBoundingClientRect();
      const width = page.clientWidth;
      const height = Number.parseFloat(getComputedStyle(page).minHeight) || page.clientHeight;
      if (Math.abs(bounds.width - width) > 2 || Math.abs(bounds.height - height) > 2) continue;
      page.style.position = "relative";
      page.style.height = `${height}px`;
      image.style.cssText += `;position:absolute;left:0;top:0;width:${width}px;height:${height}px;display:block;margin:0;`;
      page.replaceChildren(image);
    }

    if (pages.length === 1 && (pages[0].scrollHeight || 0) > 3500) {
      onProgress?.(
        "Warning: document rendered as a single tall section — page breaks may be approximate.",
      );
    }

    if (pages.length > 80) {
      throw new Error(
        `This document rendered as ${pages.length} pages. Split it into smaller files (max 80 pages per conversion).`,
      );
    }

    onProgress?.(`Capturing ${pages.length} page(s) to PDF…`);
    return await capturePagesToPdfExact(pages);
  } finally {
    removeOverrideStyle();
    host.remove();
  }
}

/** XLSX/XLS → PDF by rendering sheet tables. */
export async function convertSpreadsheetToPdf(
  file: File,
  onProgress?: (message: string) => void,
): Promise<Blob> {
  onProgress?.("Reading spreadsheet…");
  const XLSX = await import("xlsx");
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });

  if (!workbook.SheetNames.length) {
    throw new Error("Spreadsheet has no sheets");
  }

  const host = createOffscreenHost();
  host.style.width = "1100px";
  host.style.padding = "24px";

  try {
    const sheetBlocks: HTMLElement[] = [];

    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const html = XLSX.utils.sheet_to_html(sheet, { editable: false });
      const block = document.createElement("div");
      block.style.cssText =
        "background:#fff;padding:16px;margin-bottom:24px;color:#111;font-family:Arial,sans-serif;";
      block.innerHTML = `<h2 style="margin:0 0 12px;font-size:16px;">${name}</h2>${html}`;
      const table = block.querySelector("table");
      if (table) {
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";
        table.querySelectorAll("td,th").forEach((cell) => {
          const el = cell as HTMLElement;
          el.style.border = "1px solid #ccc";
          el.style.padding = "6px 8px";
          el.style.fontSize = "11px";
        });
      }
      host.appendChild(block);
      sheetBlocks.push(block);
    }

    onProgress?.("Building PDF…");
    return await capturePagesToPdfExact(sheetBlocks);
  } finally {
    host.remove();
  }
}

/**
 * PPTX → PDF.
 * Prefer slide images (common after PDF→PPTX) so visual content is preserved.
 * Fall back to extracting `<a:t>` text when a slide has no images.
 */
export async function convertPptxToPdf(
  file: File,
  onProgress?: (message: string) => void,
): Promise<Blob> {
  onProgress?.("Reading PowerPoint…");
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (slideFiles.length === 0) {
    throw new Error("No slides found in this PowerPoint file");
  }

  const presentationXml = zip.file("ppt/presentation.xml") ? await zip.file("ppt/presentation.xml")!.async("string") : "";
  const sizeTag = presentationXml.match(/<p:sldSz\b[^>]*>/)?.[0];
  const pointSize = sizeTag ? ["cx", "cy"].map(name => Number(sizeTag.match(new RegExp(name + '="(\\d+)"'))?.[1]) / 12700) : null;
  if (pointSize && pointSize.some(value => !Number.isFinite(value) || value <= 0 || value > 14400)) throw new Error("PowerPoint slide dimensions are invalid.");

  type SlidePayload = {
    index: number;
    texts: string[];
    images: Array<{ bytes: Uint8Array; mime: "image/png" | "image/jpeg" }>;
  };

  const slides: SlidePayload[] = [];

  for (let i = 0; i < slideFiles.length; i += 1) {
    onProgress?.(`Reading slide ${i + 1} of ${slideFiles.length}…`);
    const slidePath = slideFiles[i];
    const xml = await zip.file(slidePath)!.async("string");
    const texts = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g))
      .map((match) =>
        match[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .trim(),
      )
      .filter(Boolean);

    const relPath = `ppt/slides/_rels/${slidePath.split("/").pop()}.rels`;
    const relXml = zip.file(relPath) ? await zip.file(relPath)!.async("string") : "";
    const targets = Array.from(relXml.matchAll(/Target="([^"]+)"/g)).map((m) => m[1]);

    const images: SlidePayload["images"] = [];
    for (const target of targets) {
      if (!/\.(png|jpe?g|gif|webp)$/i.test(target)) continue;
      // Resolve relative path from ppt/slides/_rels → ppt/media/...
      const resolved = target.startsWith("../")
        ? `ppt/${target.replace(/^\.\.\//, "")}`
        : target.startsWith("ppt/")
          ? target
          : `ppt/slides/${target}`;
      const mediaFile = zip.file(resolved);
      if (!mediaFile) continue;
      const bytes = new Uint8Array(await mediaFile.async("arraybuffer"));
      const lower = resolved.toLowerCase();
      const mime: "image/png" | "image/jpeg" = lower.endsWith(".png")
        ? "image/png"
        : "image/jpeg";
      images.push({ bytes, mime });
    }

    slides.push({ index: i, texts, images });
  }

  const hasAnyImage = slides.some((s) => s.images.length > 0);
  const hasAnyText = slides.some((s) => s.texts.length > 0);
  if (slides.some((slide) => slide.images.length > 1 || (slide.images.length > 0 && slide.texts.length > 0))) {
    throw new Error(
      "Slides with multiple images or mixed images and text cannot be converted reliably here. Export this presentation to PDF in PowerPoint or LibreOffice to preserve its layout.",
    );
  }
  if (!hasAnyImage && !hasAnyText) {
    throw new Error(
      "This PowerPoint has no extractable text or images to put in a PDF.",
    );
  }

  // Image-first path (preserves PDF→PPTX and image-heavy decks)
  if (hasAnyImage) {
    onProgress?.("Building PDF from slide images…");
    const { PDFDocument } = await import("pdf-lib");
    const out = await PDFDocument.create();

    for (const slide of slides) {
      onProgress?.(`Adding slide ${slide.index + 1} of ${slides.length}…`);
      if (slide.images.length > 0) {
        for (const img of slide.images) {
          const embedded =
            img.mime === "image/png"
              ? await out.embedPng(img.bytes)
              : await out.embedJpg(img.bytes);
          const size = pointSize ?? [embedded.width, embedded.height];
          const page = out.addPage([size[0], size[1]]);
          const fit = Math.min(size[0] / embedded.width, size[1] / embedded.height);
          const width = embedded.width * fit, height = embedded.height * fit;
          page.drawImage(embedded, {
            x: (size[0] - width) / 2,
            y: (size[1] - height) / 2,
            width,
            height,
          });
        }
      } else if (slide.texts.length > 0) {
        // Text-only slide in a mostly visual deck
        const page = out.addPage([842, 595]); // landscape A4-ish
        const { StandardFonts, rgb } = await import("pdf-lib");
        const font = await out.embedFont(StandardFonts.Helvetica);
        const body = slide.texts.join("\n");
        const lines = body.match(/.{1,90}(\s|$)/g) || [body];
        let y = page.getHeight() - 48;
        page.drawText(`Slide ${slide.index + 1}`, {
          x: 40,
          y,
          size: 14,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= 28;
        for (const line of lines.slice(0, 40)) {
          page.drawText(line.trim().replace(/[^\x20-\x7E]/g, "?"), {
            x: 40,
            y,
            size: 11,
            font,
            color: rgb(0.15, 0.15, 0.15),
          });
          y -= 16;
          if (y < 40) break;
        }
      }
    }

    const saved = await out.save();
    return new Blob([saved as BlobPart], { type: "application/pdf" });
  }

  // Text-only fallback (legacy path)
  onProgress?.("Building PDF from slide text…");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < slides.length; i += 1) {
    onProgress?.(`Rendering slide ${i + 1} of ${slides.length}…`);
    if (i > 0) pdf.addPage();

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
    pdf.setDrawColor(220, 220, 220);
    pdf.rect(24, 24, pageWidth - 48, pageHeight - 48);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(30, 30, 30);
    pdf.text(`Slide ${i + 1}`, 40, 56);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    const body = slides[i].texts.join("\n");
    const lines = pdf.splitTextToSize(body, pageWidth - 96);
    pdf.text(lines, 40, 88);
  }

  return pdf.output("blob");
}

/** PDF pages → XLSX (one row per text line, sheet per page).
 * Falls back to in-browser OCR when the PDF has no selectable text.
 */
export async function convertPdfToXlsx(
  file: File,
  onProgress?: (message: string) => void,
): Promise<{ blob: Blob; note?: string }> {
  onProgress?.("Extracting PDF text…");
  const { extractPdfLayoutPages } = await import("@/lib/pdf-client");
  const XLSX = await import("xlsx");
  const layouts = await extractPdfLayoutPages(await file.arrayBuffer());
  let pages = layouts.map(page => page.rows.map(row => row.cells.map(cell => cell.text).join(" ")).join("\n"));
  let usedOcr = false;

  if (pages.every((page) => !page.trim())) {
    onProgress?.("No selectable text — running OCR…");
    const { ocrPdfPagesToText, pageTextsHaveContent } = await import("@/lib/pdf-ocr");
    pages = await ocrPdfPagesToText(await file.arrayBuffer(), onProgress);
    usedOcr = true;
    if (!pageTextsHaveContent(pages)) {
      throw new Error(
        "OCR found no text in this PDF. Try a clearer scan or higher-contrast document.",
      );
    }
  }

  const workbook = XLSX.utils.book_new();
  pages.forEach((pageText, index) => {
    const layout = layouts[index];
    const rows: string[][] = usedOcr ? pageText.split(/\n+/).filter(line => line.trim()).map(line => [line]) : layout.blocks.flatMap(block => block.rows.map(row => {
      if (block.type !== "table") return [row.cells.map(cell => cell.text).join(" ")];
      return block.columnStarts.map((_, column) => row.cells.find(cell => cell.columnIndex === column)?.text ?? "");
    }));
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, `Page ${index + 1}`.slice(0, 31));
  });

  const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return {
    blob: new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    note: usedOcr
      ? `OCR used: ${pages.length} page(s) recognized in your browser, then exported to Excel.`
      : "Detected horizontal text/table cells exported to Excel sheets. Values remain text; source formulas, images and styling are not reconstructed.",
  };
}

/** PDF pages → PPTX (one slide image per page for visual fidelity). */
export async function convertPdfToPptx(
  file: File,
  onProgress?: (message: string) => void,
  /** pdf.js render scale: 2≈144dpi, 3≈216dpi (sharper), 4≈288dpi */
  renderScale = 3,
): Promise<Blob> {
  onProgress?.("Rendering PDF pages…");
  const { renderAllPdfPages } = await import("@/lib/pdf-client");
  const PptxGenJS = (await import("pptxgenjs")).default;
  const scale = Math.min(4, Math.max(2, renderScale));
  const pages = await renderAllPdfPages(
    await file.arrayBuffer(),
    scale,
    (done, total) => onProgress?.(`Rendering page ${done} of ${total}…`),
  );

  if (pages.length === 0) {
    throw new Error("PDF has no pages to convert");
  }

  // Match first page aspect so portrait resumes aren't squeezed into landscape.
  const first = pages[0];
  const layoutW = first.widthPts / 72;
  const layoutH = first.heightPts / 72;

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "PDF_PAGE", width: layoutW, height: layoutH });
  pptx.layout = "PDF_PAGE";

  for (const page of pages) {
    onProgress?.(`Adding slide ${page.pageNumber}…`);
    const slide = pptx.addSlide();
    const dataUrl = `data:image/png;base64,${uint8ToBase64(page.pngBytes)}`;
    const ratio = page.widthPts / Math.max(1, page.heightPts);
    const slideRatio = layoutW / layoutH;
    let w = layoutW;
    let h = layoutH;
    if (ratio > slideRatio) {
      h = w / ratio;
    } else {
      w = h * ratio;
    }
    slide.addImage({
      data: dataUrl,
      x: (layoutW - w) / 2,
      y: (layoutH - h) / 2,
      w,
      h,
    });
  }

  const output = (await pptx.write({ outputType: "blob" })) as Blob;
  return output;
}

function uint8ToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function convertOfficeFile(options: {
  file: File;
  sourceExt: string;
  targetFormat: string;
  onProgress?: (message: string) => void;
  /** Render scale for PDF→image paths (PPTX). Default 3 for sharper text. */
  renderScale?: number;
}): Promise<{ blob: Blob; fileName: string; note?: string }> {
  const { file, sourceExt, targetFormat, onProgress, renderScale = 3 } = options;
  const base =
    file.name.replace(/\.[^.]+$/, "") ||
    "converted";
  const source = sourceExt.toLowerCase();
  const target = targetFormat.toLowerCase();

  // Word → PDF
  if ((source === "docx" || source === "doc") && target === "pdf") {
    const blob = await convertDocxToPdf(file, onProgress);
    return {
      blob,
      fileName: `${base}.pdf`,
      note: "Converted in-browser from Word layout preview.",
    };
  }

  // Excel → PDF
  if ((source === "xlsx" || source === "xls" || source === "csv") && target === "pdf") {
    const blob = await convertSpreadsheetToPdf(file, onProgress);
    return {
      blob,
      fileName: `${base}.pdf`,
      note: "Spreadsheet sheets rendered to PDF in-browser.",
    };
  }

  // PowerPoint → PDF
  if ((source === "pptx" || source === "ppt") && target === "pdf") {
    if (source === "ppt") {
      throw new Error(
        "Legacy .ppt is not supported in-browser. Save as .pptx, then convert.",
      );
    }
    const blob = await convertPptxToPdf(file, onProgress);
    return {
      blob,
      fileName: `${base}.pdf`,
      note: "Converted in-browser. Slide images are preserved when present; otherwise slide text is used.",
    };
  }

  // PDF → Excel
  if (source === "pdf" && (target === "xlsx" || target === "excel")) {
    const result = await convertPdfToXlsx(file, onProgress);
    return {
      blob: result.blob,
      fileName: `${base}.xlsx`,
      note: result.note,
    };
  }

  // PDF → PowerPoint
  if (source === "pdf" && (target === "pptx" || target === "powerpoint")) {
    const blob = await convertPdfToPptx(file, onProgress, renderScale);
    return {
      blob,
      fileName: `${base}.pptx`,
      note: `Each PDF page added as a high-quality slide image (render ${renderScale}×).`,
    };
  }

  throw new Error(
    `Conversion ${source || "file"} → ${target} is not supported yet in the browser converter.`,
  );
}
