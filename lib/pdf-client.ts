"use client";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

export async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs;
}

export async function loadPdfDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  // pdf.js transfers the buffer it's given to its worker, detaching it from
  // the caller. Hand it a copy so `data` stays usable for repeat calls or
  // later pdf-lib reads on the same bytes.
  return pdfjs.getDocument({
    data: new Uint8Array(data.slice(0)),
    // Prefer pdf.js image decoding over the browser ImageDecoder path for
    // consistent raster-PDF previews, including PNG alpha masks.
    isImageDecoderSupported: false,
  }).promise;
}

/** pdf.js v6+: PDFDocumentProxy has cleanup(); destroy() lives on loadingTask. */
async function releasePdfDocument(pdf: PDFDocumentProxy) {
  try {
    if (typeof pdf.cleanup === "function") {
      await pdf.cleanup();
    }
  } catch {
    // ignore
  }
  try {
    const task = pdf.loadingTask;
    if (task && typeof task.destroy === "function") {
      await task.destroy();
    }
  } catch {
    // ignore
  }
}

function releasePdfPage(page: PDFPageProxy) {
  try {
    if (typeof page.cleanup === "function") {
      page.cleanup();
    }
  } catch {
    // ignore
  }
}

export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pages = await extractPdfTextByPage(data);
  return pages.join("\n\n").trim();
}

/** Group pdf.js text items into lines using Y positions for better reading order. */
export async function extractPdfTextByPage(data: ArrayBuffer): Promise<string[]> {
  const pdf = await loadPdfDocument(data);
  try {
    const pages: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      pages.push(await extractPageTextStructured(page));
      releasePdfPage(page);
    }
    // Blank pages still have a position in the source document. Removing them
    // renumbers later pages and loses empty spreadsheet sheets on conversion.
    return pages;
  } finally {
    await releasePdfDocument(pdf);
  }
}

async function extractPageTextStructured(page: PDFPageProxy): Promise<string> {
  const content = await page.getTextContent();
    type Row = { y: number; parts: Array<{ x: number; width: number; text: string }> };
  const rows: Row[] = [];

  for (const item of content.items) {
    if (!("str" in item) || !item.str) continue;
    const transform = "transform" in item ? item.transform : null;
    if (!transform) continue;

    const x = transform[4] as number;
      const width = "width" in item && typeof item.width === "number" ? item.width : 0;
    const y = Math.round((transform[5] as number) * 10) / 10;
    const existing = rows.find((row) => Math.abs(row.y - y) < 2.5);

    if (existing) {
        existing.parts.push({ x, width, text: item.str });
    } else {
        rows.push({ y, parts: [{ x, width, text: item.str }] });
    }
  }

  rows.sort((a, b) => b.y - a.y);

  return rows
    .map((row) =>
      row.parts
        .sort((a, b) => a.x - b.x)
          .map((part, index, parts) => {
            const previous = parts[index - 1];
            const gap = previous ? part.x - (previous.x + previous.width) : 0;
            return `${gap > 2 && previous && !/\s$/.test(previous.text) && !/^\s/.test(part.text) ? " " : ""}${part.text}`;
          })
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
}

export interface RenderedPdfPage {
  pageNumber: number;
  pngBytes: Uint8Array;
  /** PDF page width in points (1/72"). */
  widthPts: number;
  /** PDF page height in points (1/72"). */
  heightPts: number;
}

async function renderLoadedPageToBlob(
  page: PDFPageProxy,
  format: "png" | "jpg",
  scale: number,
  options?: { maxEdgePx?: number; jpegQuality?: number },
): Promise<Blob> {
  const maxEdge = options?.maxEdgePx ?? 4096;
  const base = page.getViewport({ scale: 1 });
  const longest = Math.max(base.width, base.height) || 1;
  const cappedScale = Math.min(scale, maxEdge / longest);
  const viewport = page.getViewport({ scale: cappedScale });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: false });

  if (!context) {
    throw new Error("Could not create canvas context");
  }

  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  try {
    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const quality = format === "jpg" ? (options?.jpegQuality ?? 0.85) : undefined;

    const encoded = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to export page image"));
            return;
          }
          resolve(blob);
        },
        mime,
        quality,
      );
    });
    // Materialize the encoder result before releasing its canvas. Some browser
    // Blob/FileReader paths can reject an otherwise valid canvas image.
    try {
      return new Blob([await encoded.arrayBuffer()], { type: mime });
    } catch {
      const data = canvas.toDataURL(mime, quality);
      if (!data.startsWith(`data:${mime};base64,`)) throw new Error("Failed to export page image");
      const binary = atob(data.slice(data.indexOf(",") + 1));
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
      return new Blob([bytes], { type: mime });
    }
  } finally {
    // Release GPU/canvas memory ASAP for long documents
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function renderPdfPageToBlob(
  data: ArrayBuffer,
  pageNumber: number,
  format: "png" | "jpg",
  scale = 2,
): Promise<Blob> {
  const pdf = await loadPdfDocument(data);
  try {
    const page = await pdf.getPage(pageNumber);
    try {
      return await renderLoadedPageToBlob(page, format, scale);
    } finally {
      releasePdfPage(page);
    }
  } finally {
    await releasePdfDocument(pdf);
  }
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

export interface PdfPageImageResult {
  pageCount: number;
  /** First few pages for on-screen preview (object URLs — caller must revoke). */
  preview: { name: string; url: string }[];
  /** Single-page download when pageCount === 1. */
  single?: { name: string; blob: Blob };
  /** Multi-page ZIP download. */
  zipBlob?: Blob;
}

/**
 * Convert PDF → images with one document load. Streams pages into a ZIP and
 * only keeps a few preview thumbnails in memory (safe for large / many-page PDFs).
 */
export async function convertPdfToImages(
  data: ArrayBuffer,
  options: {
    format: "png" | "jpg";
    scale?: number;
    stem?: string;
    maxPreviewPages?: number;
    maxEdgePx?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<PdfPageImageResult> {
  const format = options.format;
  const scale = options.scale ?? 2;
  const stem = options.stem || "page";
  const maxPreview = options.maxPreviewPages ?? 8;
  const ext = format === "jpg" ? "jpg" : "png";

  const pdf = await loadPdfDocument(data);
  const pageCount = pdf.numPages;
  const preview: { name: string; url: string }[] = [];

  try {
    if (pageCount === 1) {
      const page = await pdf.getPage(1);
      let blob: Blob;
      try {
        blob = await renderLoadedPageToBlob(page, format, scale, {
          maxEdgePx: options.maxEdgePx,
        });
      } finally {
        releasePdfPage(page);
      }
      const name = `${stem}-page-1.${ext}`;
      options.onProgress?.(1, 1);
      return {
        pageCount: 1,
        preview: [{ name, url: URL.createObjectURL(blob) }],
        single: { name, blob },
      };
    }

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (let i = 1; i <= pageCount; i += 1) {
      const page = await pdf.getPage(i);
      let blob: Blob;
      try {
        blob = await renderLoadedPageToBlob(page, format, scale, {
          maxEdgePx: options.maxEdgePx,
        });
      } finally {
        releasePdfPage(page);
      }

      const name = `${stem}-page-${i}.${ext}`;
      // Materialize canvas bytes explicitly: JSZip's FileReader Blob path can
      // fail with NotReadableError in Chromium during JPEG archive creation.
      zip.file(name, await blob.arrayBuffer());

      if (preview.length < maxPreview) {
        preview.push({ name, url: URL.createObjectURL(blob) });
      }

      options.onProgress?.(i, pageCount);
      await yieldToBrowser();
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
      // STORE is faster / less peak RAM for already-compressed JPEGs
      compression: format === "jpg" ? "STORE" : "DEFLATE",
      compressionOptions: { level: 1 },
    });

    return { pageCount, preview, zipBlob };
  } finally {
    await releasePdfDocument(pdf);
  }
}

/** Render every PDF page to PNG for layout-preserving Word conversion. */
export async function renderAllPdfPages(
  data: ArrayBuffer,
  scale = 2.5,
  onProgress?: (done: number, total: number) => void,
): Promise<RenderedPdfPage[]> {
  const pdf = await loadPdfDocument(data);
  try {
    const pages: RenderedPdfPage[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      let blob: Blob;
      try {
        blob = await renderLoadedPageToBlob(page, "png", scale);
      } finally {
        releasePdfPage(page);
      }
      const buffer = new Uint8Array(await blob.arrayBuffer());

      pages.push({
        pageNumber,
        pngBytes: buffer,
        widthPts: baseViewport.width,
        heightPts: baseViewport.height,
      });

      onProgress?.(pageNumber, pdf.numPages);
      await yieldToBrowser();
    }

    return pages;
  } finally {
    await releasePdfDocument(pdf);
  }
}

/** Render only the first N pages (for result thumbnails). */
export async function renderFirstPdfPages(
  data: ArrayBuffer,
  maxPages = 3,
  scale = 1.25,
  onProgress?: (done: number, total: number) => void,
): Promise<{ pages: RenderedPdfPage[]; pageCount: number }> {
  const pdf = await loadPdfDocument(data);
  try {
    const pageCount = pdf.numPages;
    const limit = Math.min(maxPages, pageCount);
    const pages: RenderedPdfPage[] = [];

    for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      let blob: Blob;
      try {
        blob = await renderLoadedPageToBlob(page, "png", scale);
      } finally {
        releasePdfPage(page);
      }
      const buffer = new Uint8Array(await blob.arrayBuffer());
      pages.push({
        pageNumber,
        pngBytes: buffer,
        widthPts: baseViewport.width,
        heightPts: baseViewport.height,
      });
      onProgress?.(pageNumber, limit);
    }

    return { pages, pageCount };
  } finally {
    await releasePdfDocument(pdf);
  }
}

export type ReconstructedPdfPage = import("./pdf-layout").PdfPageLayout & { widthPts: number; heightPts: number };
export async function extractPdfLayoutPages(data: ArrayBuffer): Promise<ReconstructedPdfPage[]> {
  const { extractPdfLayout } = await import("./pdf-layout");
  const pdf = await loadPdfDocument(data);
  try {
    const pages: ReconstructedPdfPage[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      try {
        const content = await page.getTextContent();
        const items = content.items.flatMap(item => "str" in item && item.str.length > 0 ? [{ str: item.str, width: item.width, transform: item.transform, fontName: item.fontName, height: item.height }] : []);
        const layout = extractPdfLayout(items);
        if (layout.warnings.length) throw new Error("This PDF has text geometry that cannot be reconstructed reliably. Use page-image mode to preserve its appearance.");
        const viewport = page.getViewport({ scale: 1 });
        pages.push({ ...layout, widthPts: viewport.width, heightPts: viewport.height });
      } finally { releasePdfPage(page); }
    }
    return pages;
  } finally { await releasePdfDocument(pdf); }
}
