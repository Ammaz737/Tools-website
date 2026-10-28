"use client";

import Link from "next/link";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dropzone,
  ResultPanel,
  Button,
  Select,
  Badge,
  Card,
  PdfPagePreview,
} from "@/components/ui";
import {
  extractPdfTextByPage,
  extractPdfLayoutPages,
  renderAllPdfPages,
} from "@/lib/pdf-client";
import {
  buildDocxFromPageTexts,
  buildDocxFromLayouts,
  buildDocxFromPdfPages,
} from "@/lib/docx-from-text";
import { validateDocumentFile } from "@/lib/pdf-ops";
import { convertOfficeFile } from "@/lib/office-client";
import {
  buildPdfPreviewUrls,
  revokePdfPreviewUrls,
} from "@/lib/pdf-preview";

function extensionOf(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

type DocxMode = "exact" | "editable";

const TARGET_OPTIONS = [
  { value: "docx", label: "Word Document (.docx)" },
  { value: "pdf", label: "PDF Document (.pdf)" },
  { value: "xlsx", label: "Excel Spreadsheet (.xlsx)" },
  { value: "pptx", label: "PowerPoint Presentation (.pptx)" },
  { value: "txt", label: "Plain Text (.txt)" },
];

export const OfficeConverterTool: React.FC<{
  defaultTargetFormat?: string;
  /** When set, the target format select is locked to this value. */
  lockedTargetFormat?: string;
  /** Override Dropzone accept attribute for dedicated tool routes. */
  accept?: string;
  hint?: string;
}> = ({
  defaultTargetFormat = "docx",
  lockedTargetFormat,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,application/pdf",
  hint = "Supports PDF ↔ Word / Excel / PowerPoint conversions in your browser.",
}) => {
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [conversionEngine, setConversionEngine] = useState("browser");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/convert-office", { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(value => setNativeAvailable(value?.available === true))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState(
    lockedTargetFormat || defaultTargetFormat,
  );
  const [docxMode, setDocxMode] = useState<DocxMode>("exact");
  const [renderScale, setRenderScale] = useState("3");
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedName, setConvertedName] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewPageCount, setPreviewPageCount] = useState(0);
  const [progress, setProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];
  const sourceExt = file ? extensionOf(file) : "";
  const activeTarget = lockedTargetFormat || targetFormat;

  const nativeEligible = activeTarget === "pdf" && ["docx", "xlsx", "pptx"].includes(sourceExt);

  const isPdfToPptx =
    (sourceExt === "pdf" || file?.type === "application/pdf") &&
    activeTarget === "pptx";

  const isPdfToDocx =
    (sourceExt === "pdf" || file?.type === "application/pdf") &&
    activeTarget === "docx";

  const helpText = useMemo(() => {
    if (!file) return "Upload a document, then choose the target format.";

    if ((sourceExt === "docx" || sourceExt === "doc") && activeTarget === "pdf") {
      return "Browser rendering: Word pages become images in the PDF. Complex layouts and fonts may differ from Microsoft Word. Large or complex docs may take a minute. Legacy .doc is not supported — use .docx.";
    }

    if ((sourceExt === "xlsx" || sourceExt === "xls" || sourceExt === "csv") && activeTarget === "pdf") {
      return "Renders spreadsheet sheets into a PDF in your browser.";
    }

    if (isPdfToDocx) {
      return docxMode === "exact"
        ? "Page-image mode embeds each PDF page as an image in Word. Text, tables and images cannot be edited separately."
        : "Editable mode reconstructs horizontal text and detected tables. Images, exact font styles and complex layouts are not retained; check the result. For scans, OCR runs automatically if needed.";
    }

    if (sourceExt === "pdf" && activeTarget === "txt") {
      return "Exports PDF text as .txt. Scanned PDFs automatically run OCR in your browser first.";
    }

    if (sourceExt === "pdf" && activeTarget === "xlsx") {
      return "Exports PDF text into Excel (one sheet per page). Scanned PDFs run OCR automatically.";
    }

    if (sourceExt === "pdf" && activeTarget === "pptx") {
      return "Turns each PDF page into a PowerPoint slide image. Use High quality for sharper text (larger file). Blurry old PPTX files need a fresh convert from the original PDF.";
    }

    if ((sourceExt === "pptx" || sourceExt === "ppt") && activeTarget === "pdf") {
      return "Supports text extraction and presentations containing one page image per slide. Original slide layout is not reconstructed. Slides with multiple images or mixed text and images are rejected to prevent content loss.";
    }

    return "Choose a supported source/target pair. Common PDF ↔ Word/Excel/PPT flows run in the browser.";
  }, [activeTarget, docxMode, file, isPdfToDocx, sourceExt]);

  const clearPreviews = () => {
    setPreviewImages((prev) => {
      revokePdfPreviewUrls(prev);
      return [];
    });
    setPreviewPageCount(0);
  };

  const setPdfPreviewsFromBlob = async (blob: Blob) => {
    setProgress("Building page preview…");
    try {
      const { urls, pageCount } = await buildPdfPreviewUrls(blob, {
        maxPages: 3,
        scale: 1.25,
        onProgress: (done, total) => {
          setProgress(`Preview page ${done} of ${total}…`);
        },
      });
      setPreviewImages(urls);
      setPreviewPageCount(pageCount);
    } catch {
      // Preview is optional; download still works
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setConvertedUrl(null);
    setPreviewText("");
    clearPreviews();
    setProgress(null);

    try {
      await validateDocumentFile(file);
      const maxBytes = 40 * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error("File is larger than 40MB. Split the document or use a smaller file.");
      }

      const isPdfSource = sourceExt === "pdf" || file.type === "application/pdf";
      const wantsDocx = activeTarget === "docx";
      const wantsTxt = activeTarget === "txt" || activeTarget === "text";
      const baseName = file.name.replace(/\.[^.]+$/i, "") || "converted";

      // PDF → DOCX
      if (isPdfSource && wantsDocx) {
        const bytes = await file.arrayBuffer();

        if (docxMode === "exact") {
          setProgress("Rendering PDF pages…");
          const pages = await renderAllPdfPages(bytes, 3, (done, total) => {
            setProgress(`Rendering page ${done} of ${total}…`);
          });

          setProgress("Building Word document…");
          const docxBlob = await buildDocxFromPdfPages(pages);
          setConvertedUrl(URL.createObjectURL(docxBlob));
          setConvertedName(`${baseName}.docx`);
          setPreviewImages(
            pages.slice(0, 3).map((page) =>
              URL.createObjectURL(
                new Blob([page.pngBytes as BlobPart], { type: "image/png" }),
              ),
            ),
          );
          setPreviewPageCount(pages.length);
          setPreviewText(
            `Page-image mode: ${pages.length} page${pages.length === 1 ? "" : "s"} embedded as page images.`,
          );
          return;
        }

        setProgress("Extracting editable text…");
        const layouts = await extractPdfLayoutPages(bytes);
        let pageTexts = layouts.map(page => page.rows.map(row => row.cells.map(cell => cell.text).join(" ")).join("\n"));
        let usedOcr = false;
        if (pageTexts.length === 0 || pageTexts.every((page) => !page.trim())) {
          setProgress("No selectable text — running OCR…");
          const { ocrPdfPagesToText, pageTextsHaveContent } = await import("@/lib/pdf-ocr");
          pageTexts = await ocrPdfPagesToText(bytes, setProgress);
          usedOcr = true;
          if (!pageTextsHaveContent(pageTexts)) {
            throw new Error(
              "OCR found no text. Try page-image mode, or a clearer scan.",
            );
          }
        }

        const docxBlob = usedOcr ? await buildDocxFromPageTexts(baseName, pageTexts) : await buildDocxFromLayouts(layouts);
        setConvertedUrl(URL.createObjectURL(docxBlob));
        setConvertedName(`${baseName}.docx`);
        setPreviewText(
          (usedOcr ? "[OCR used]\n\n" : "") + pageTexts.join("\n\n").slice(0, 1400),
        );
        return;
      }

      // PDF → TXT
      if (isPdfSource && wantsTxt) {
        const bytes = await file.arrayBuffer();
        let pageTexts = await extractPdfTextByPage(bytes);
        let usedOcr = false;
        let text = pageTexts.join("\n\n\n").trim();
        if (!text) {
          setProgress("No selectable text — running OCR…");
          const { ocrPdfPagesToText, pageTextsHaveContent } = await import("@/lib/pdf-ocr");
          pageTexts = await ocrPdfPagesToText(bytes, setProgress);
          usedOcr = true;
          if (!pageTextsHaveContent(pageTexts)) {
            throw new Error(
              "OCR found no text in this PDF. Try a clearer scan.",
            );
          }
          text = pageTexts.join("\n\n\n").trim();
        }
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        setConvertedUrl(URL.createObjectURL(blob));
        setConvertedName(`${baseName}.txt`);
        setPreviewText((usedOcr ? "[OCR used]\n\n" : "") + text.slice(0, 1400));
        return;
      }

      if (nativeEligible && conversionEngine === "server") {
        if (file.size > 20 * 1024 * 1024) throw new Error("Server conversion accepts files up to 20MB.");
        const toolId = { docx: "word-to-pdf", xlsx: "excel-to-pdf", pptx: "powerpoint-to-pdf" }[sourceExt];
        setProgress("Uploading document for server conversion…");
        const response = await fetch(`/api/convert-office?toolId=${toolId}&format=${sourceExt}`, {
          method: "POST", headers: { "Content-Type": "application/octet-stream" },
          body: file, signal: AbortSignal.timeout(70000),
        });
        if (!response.ok) {
          const failure = await response.json().catch(() => null);
          throw new Error(typeof failure?.error === "string" ? failure.error : "Server conversion failed. Please retry.");
        }
        const blob = await response.blob();
        if (!blob.size || !response.headers.get("content-type")?.includes("application/pdf")) throw new Error("The server returned an invalid PDF.");
        setConvertedUrl(URL.createObjectURL(blob));
        setConvertedName(`${baseName}.pdf`);
        setPreviewText("Converted by the configured server Office engine. Review fonts, page breaks and formulas before use.");
        await setPdfPreviewsFromBlob(blob);
        return;
      }

      // Word/Excel/PPT → PDF and PDF → Excel/PPTX (browser converters)
      const result = await convertOfficeFile({
        file,
        sourceExt,
        targetFormat: activeTarget,
        onProgress: setProgress,
        renderScale: Number(renderScale) || 3,
      });

      setConvertedUrl(URL.createObjectURL(result.blob));
      setConvertedName(result.fileName);
      setPreviewText(result.note || "Conversion complete.");

      if (activeTarget === "pdf") {
        await setPdfPreviewsFromBlob(result.blob);
      } else if (isPdfSource && (activeTarget === "pptx" || activeTarget === "xlsx")) {
        // Show source PDF page thumbs so the user sees what was converted
        await setPdfPreviewsFromBlob(file);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Conversion error");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setConvertedUrl(null);
          setPreviewText("");
          clearPreviews();
          setError(null);
        }}
        multiple={false}
        accept={accept}
        hint={hint}
      />

      {file && (
        <div className="space-y-6">
          {!lockedTargetFormat && (
            <Select
              label="Convert Target Format"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              options={TARGET_OPTIONS}
            />
          )}

          {nativeEligible && nativeAvailable && (
            <>
              <Select label="Conversion processing" value={conversionEngine} aria-describedby={conversionEngine === "server" ? "office-server-processing" : undefined}
                onChange={event => { setConversionEngine(event.target.value); setConvertedUrl(null); clearPreviews(); }}
                options={[{ value: "browser", label: "Browser (local processing)" }, { value: "server", label: "Server Office engine (uploads document)" }]} />
              {conversionEngine === "server" && <p id="office-server-processing" role="note" className="text-xs text-[var(--ink-soft)]">Your document is uploaded to the configured Office service for conversion. Maximum 20MB. Fonts and layout can still differ; review the downloaded PDF. {sourceExt === "xlsx" && "Spreadsheet formulas are recalculated by the server. Excel-specific functions and external links may differ; verify important totals."}</p>}
            </>
          )}

          {isPdfToDocx && (
            <>
              <Select
                label="Word conversion mode"
                value={docxMode}
                onChange={(e) => setDocxMode(e.target.value as DocxMode)}
                options={[
                  {
                    value: "exact",
                    label: "Page images (text is not editable)",
                  },
                  {
                    value: "editable",
                    label: "Editable text and detected tables (approximate)",
                  },
                ]}
              />
              {docxMode === "editable" && (
                <Card variant="bordered" className="border-[var(--warn)] p-4 text-xs text-[var(--ink-soft)]">
                  This mode reconstructs horizontal text and detected tables. Images, complex layouts and original font styles are not retained. Review the result before use.
                  Choose page images to retain the page appearance. Scanned PDFs: use{" "}
                  <Link href="/tools/ocr-pdf" className="text-[var(--accent)] underline">
                    OCR PDF
                  </Link>{" "}
                  first.
                </Card>
              )}
            </>
          )}

          {isPdfToPptx && (
            <Select
              label="Slide image quality"
              value={renderScale}
              onChange={(e) => setRenderScale(e.target.value)}
              options={[
                { value: "2", label: "Standard (faster, ~144 DPI)" },
                { value: "3", label: "High (sharper, ~216 DPI) — recommended" },
                { value: "4", label: "Ultra (sharpest, ~288 DPI, slower)" },
              ]}
            />
          )}

          <Card variant="sunk" className="p-4 text-xs leading-relaxed text-[var(--ink-soft)]">
            {nativeEligible && conversionEngine === "server" ? "Server conversion uses LibreOffice to render the document, including supported tables, charts and slide objects." : helpText}
          </Card>

          <Button variant="primary" onClick={handleConvert} loading={loading}>
            Convert Document ({file.name})
          </Button>

          {progress && (
            <p role="status" className="font-mono text-xs text-[var(--ink-faint)]">{progress}</p>
          )}

          {error && (
            <Card
              role="alert"
              variant="bordered"
              className="border-[var(--danger)] p-4 text-xs text-[var(--danger)]"
            >
              {error}
            </Card>
          )}

          {convertedUrl && (
            <ResultPanel
              title="Converted Document Ready"
              status="done"
              downloadFileName={convertedName}
              downloadBlobUrl={convertedUrl}
              onClear={() => {
                setFiles([]);
                setConvertedUrl(null);
                setPreviewText("");
                clearPreviews();
              }}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="success" size="md">
                    Ready: {convertedName}
                  </Badge>
                  {isPdfToDocx && (
                    <Badge variant="accent" size="sm">
                      {docxMode === "exact" ? "Page images" : "Editable text and tables"}
                    </Badge>
                  )}
                  {conversionEngine === "browser" && (sourceExt === "docx" || sourceExt === "doc") && activeTarget === "pdf" && (
                    <Badge variant="accent" size="sm">
                      Visual capture (image pages)
                    </Badge>
                  )}
                  {conversionEngine === "browser" && (sourceExt === "pptx" || sourceExt === "ppt") && activeTarget === "pdf" && (
                    <Badge variant="accent" size="sm">
                      PPTX → PDF (images preserved when present)
                    </Badge>
                  )}
                  {previewText.startsWith("[OCR used]") && (
                    <Badge variant="accent" size="sm">
                      OCR used (browser)
                    </Badge>
                  )}
                  {previewText.includes("OCR used:") && (
                    <Badge variant="accent" size="sm">
                      OCR used (browser)
                    </Badge>
                  )}
                </div>

                {previewImages.length > 0 && (
                  <PdfPagePreview urls={previewImages} pageCount={previewPageCount} />
                )}

                {previewText && (
                  <pre className="max-h-56 overflow-auto rounded-[10px] bg-[var(--surface-sunk)] p-3 text-left font-mono text-xs whitespace-pre-wrap text-[var(--ink-soft)]">
                    {previewText}
                    {previewText.length >= 1400 ? "…" : ""}
                  </pre>
                )}
              </div>
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};
