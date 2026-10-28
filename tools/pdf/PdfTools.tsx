"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dropzone as BaseDropzone,
  ResultPanel,
  Button,
  Input,
  Select,
  Slider,
  Badge,
  Card,
  ProgressBar,
  PdfPagePreview,
} from "@/components/ui";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import {
  baseName,
  formatBytes,
  friendlyPdfError,
  hexToRgb,
  parsePageSelection,
  revokeObjectUrl,
  toObjectUrl,
  toPdfBlob,
  validatePdfBytes,
} from "@/lib/pdf-ops";
import {
  buildPdfPreviewUrls,
  revokePdfPreviewUrls,
} from "@/lib/pdf-preview";

/* ─── Shared UI ─────────────────────────────────────────────────────────── */

function Dropzone(props: React.ComponentProps<typeof BaseDropzone>) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const revision = useRef(0);
  return <div className="space-y-2"><BaseDropzone {...props} maxSizeMB={40} onFilesChange={(next) => {
    const current = ++revision.current;
    setValidationError(null);
    if (!next.length) { props.onFilesChange([]); return; }
    void (async () => {
      try {
        if (next.length > 10 || next.reduce((sum, file) => sum + file.size, 0) > 80 * 1024 * 1024) throw new Error("Use up to 10 PDFs with a combined size up to 80 MB.");
        for (const file of next) await validatePdfBytes(await file.arrayBuffer());
        if (current === revision.current) props.onFilesChange(next);
      } catch (error) { if (current === revision.current) { props.onFilesChange([]); setValidationError(friendlyPdfError(error)); } }
    })();
  }} />{validationError && <p role="alert" className="text-sm text-[var(--danger)]">{validationError}</p>}</div>;
}

function PrivacyNote({ children }: { children?: React.ReactNode }) {
  return (
    <Card variant="sunk" className="px-4 py-3 text-xs leading-relaxed text-[var(--ink-soft)]">
      {children ??
        "Runs locally in your browser — files never leave your device."}
    </Card>
  );
}

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Card variant="bordered" className="border-[var(--danger)] px-4 py-3 text-xs text-[var(--danger)]">
      {message}
    </Card>
  );
}

function SuccessBody({
  label,
  detail,
  previewUrls,
  previewPageCount,
}: {
  label: string;
  detail?: React.ReactNode;
  previewUrls?: string[];
  previewPageCount?: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
      <Badge variant="success" size="md">
        {label}
      </Badge>
      {detail ? (
        <div className="max-w-md text-xs leading-relaxed text-[var(--ink-soft)]">{detail}</div>
      ) : null}
      {previewUrls && previewUrls.length > 0 ? (
        <PdfPagePreview urls={previewUrls} pageCount={previewPageCount} />
      ) : null}
    </div>
  );
}

function useObjectUrlState() {
  const urlRef = useRef<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const replace = (next: string | null) => {
    if (urlRef.current) revokeObjectUrl(urlRef.current);
    urlRef.current = next;
    setUrl(next);
  };

  useEffect(
    () => () => {
      if (urlRef.current) revokeObjectUrl(urlRef.current);
    },
    [],
  );

  return [url, replace] as const;
}

/** Object-URL thumbnails for the first pages of a result PDF. */
function usePdfPreviewUrls() {
  const urlsRef = useRef<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);

  const clear = () => {
    revokePdfPreviewUrls(urlsRef.current);
    urlsRef.current = [];
    setUrls([]);
    setPageCount(0);
  };

  const fromBytes = async (data: ArrayBuffer | Uint8Array | Blob) => {
    clear();
    try {
      const result = await buildPdfPreviewUrls(data, { maxPages: 3, scale: 1.25 });
      urlsRef.current = result.urls;
      setUrls(result.urls);
      setPageCount(result.pageCount);
    } catch {
      // Preview is optional
    }
  };

  useEffect(
    () => () => {
      revokePdfPreviewUrls(urlsRef.current);
    },
    [],
  );

  return { urls, pageCount, clear, fromBytes };
}

/**
 * Strip open-password / permission encryption by copying pages into a fresh
 * unencrypted document. A plain load+save keeps Encrypt dict when the source
 * was opened with ignoreEncryption (common empty-password path).
 */
async function unlockPdfBytes(
  bytes: ArrayBuffer,
  password?: string,
): Promise<Uint8Array> {
  const { PDFDocument: CantooDoc } = await import("@cantoo/pdf-lib");

  let src;
  if (password) {
    try {
      src = await CantooDoc.load(bytes, { password });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/password|encrypt/i.test(msg)) {
        throw new Error(
          "Wrong password, or this encryption isn’t supported in the browser. Double-check the password and try again.",
        );
      }
      throw err;
    }
  } else {
    try {
      src = await CantooDoc.load(bytes);
    } catch {
      // Open-password or owner-only: need decrypt path or ignoreEncryption.
      try {
        src = await CantooDoc.load(bytes, { ignoreEncryption: true });
      } catch {
        throw new Error(
          "This PDF needs a password to unlock. Enter the open password and try again.",
        );
      }
    }
  }

  const out = await CantooDoc.create();
  const pages = await out.copyPages(src, src.getPageIndices());
  pages.forEach((page) => out.addPage(page));
  const unlocked = await out.save({ useObjectStreams: false });

  // Confirm encryption is gone (detect open-password lock).
  try {
    await CantooDoc.load(unlocked);
  } catch {
    throw new Error(
      "Could not fully remove encryption from this PDF. Enter the correct password — some AES-encrypted files need a dedicated unlocker.",
    );
  }

  return unlocked;
}

/* ─── 1. Merge PDF ──────────────────────────────────────────────────────── */

export const MergePdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedUrl, setMergedUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFiles([]);
    setMergedUrl(null);
    preview.clear();
    setError(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setError(null);
    setMergedUrl(null);
    preview.clear();
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        if (merged.getPageCount() + src.getPageCount() > 50) throw new Error("Merged output exceeds the 50-page processing limit.");
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const out = await merged.save();
      setMergedUrl(toObjectUrl(out));
      await preview.fromBytes(out);
    } catch (err) {
      setError(friendlyPdfError(err, "Could not merge these PDFs"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setMergedUrl(null);
          preview.clear();
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple
        hint="Upload 2 or more PDFs. Reorder with the arrows before merging."
      />

      {files.length >= 2 && (
        <div className="space-y-4">
          <Button variant="primary" onClick={handleMerge} loading={processing}>
            Merge {files.length} PDFs
          </Button>
          <ErrorNote message={error} />
          {mergedUrl && (
            <ResultPanel
              title="Merged PDF"
              status="done"
              downloadFileName="merged-document.pdf"
              downloadBlobUrl={mergedUrl}
              onClear={reset}
            >
              <SuccessBody
                label="PDFs merged"
                detail={`${files.length} files combined into one document.`}
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 2. Split PDF ──────────────────────────────────────────────────────── */

export const SplitPdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"range" | "every">("range");
  const [pageRange, setPageRange] = useState("1-2");
  const [everyN, setEveryN] = useState(1);
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [outputName, setOutputName] = useState("split.pdf");
  const [pageCount, setPageCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];

  useEffect(() => {
    let cancelled = false;
    async function meta() {
      if (!file) {
        setPageCount(0);
        return;
      }
      try {
        const pdf = await PDFDocument.load(await file.arrayBuffer(), {
          ignoreEncryption: true,
        });
        if (!cancelled) setPageCount(pdf.getPageCount());
      } catch {
        if (!cancelled) setError("Could not read this PDF");
      }
    }
    void meta();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const reset = () => {
    setFiles([]);
    setOutputUrl(null);
    preview.clear();
    setError(null);
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    preview.clear();
    try {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      const stem = baseName(file.name);

      if (mode === "range") {
        const indices = parsePageSelection(pageRange, total);
        if (indices.length === 0) {
          throw new Error(`Enter valid pages between 1 and ${total}, e.g. 1-3, 5`);
        }
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, indices);
        copied.forEach((p) => out.addPage(p));
        const saved = await out.save();
        setOutputName(`${stem}-pages.pdf`);
        setOutputUrl(toObjectUrl(saved));
        await preview.fromBytes(saved);
      } else {
        const n = Math.max(1, everyN);
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        let part = 1;
        let firstPartBytes: Uint8Array | null = null;
        for (let start = 0; start < total; start += n) {
          const indices = Array.from(
            { length: Math.min(n, total - start) },
            (_, i) => start + i,
          );
          const out = await PDFDocument.create();
          const copied = await out.copyPages(src, indices);
          copied.forEach((p) => out.addPage(p));
          const saved = await out.save();
          if (!firstPartBytes) firstPartBytes = saved;
          zip.file(`${stem}-part-${part}.pdf`, saved);
          part += 1;
        }
        const blob = await zip.generateAsync({ type: "blob" });
        setOutputName(`${stem}-split.zip`);
        setOutputUrl(URL.createObjectURL(blob));
        if (firstPartBytes) await preview.fromBytes(firstPartBytes);
      }
    } catch (err) {
      setError(friendlyPdfError(err, "Could not split this PDF"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          preview.clear();
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload one PDF to extract pages or split into parts"
      />

      {file && (
        <div className="space-y-4">
          {pageCount > 0 && (
            <p className="font-mono text-xs text-[var(--ink-faint)]">
              {pageCount} page{pageCount === 1 ? "" : "s"} detected
            </p>
          )}
          <Select
            label="Split mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as "range" | "every")}
            options={[
              { value: "range", label: "Extract page range → one PDF" },
              { value: "every", label: "Split every N pages → ZIP" },
            ]}
          />
          {mode === "range" ? (
            <Input
              label="Page range"
              helperText={`Examples: 1-3, 5  ·  Document has ${pageCount || "?"} pages`}
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              mono
            />
          ) : (
            <Slider
              label="Pages per file"
              min={1}
              max={Math.max(1, pageCount || 10)}
              value={everyN}
              onChange={setEveryN}
            />
          )}
          <Button variant="primary" onClick={handleSplit} loading={processing}>
            {mode === "range" ? "Extract pages" : "Split into ZIP"}
          </Button>
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="Split result"
              status="done"
              downloadFileName={outputName}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <SuccessBody
                label="Ready to download"
                detail={outputName}
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 2b. Delete PDF Pages ──────────────────────────────────────────────── */

export const DeletePdfPagesTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pagesToDelete, setPagesToDelete] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];

  useEffect(() => {
    let cancelled = false;
    async function loadMeta() {
      if (!file) {
        setPageCount(0);
        return;
      }
      try {
        const pdf = await PDFDocument.load(await file.arrayBuffer(), {
          ignoreEncryption: true,
        });
        if (!cancelled) setPageCount(pdf.getPageCount());
      } catch {
        if (!cancelled) setError("Could not read PDF");
      }
    }
    void loadMeta();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const reset = () => {
    setFiles([]);
    setPagesToDelete("");
    setOutputUrl(null);
    preview.clear();
    setError(null);
  };

  const handleDelete = async () => {
    if (!file || !pagesToDelete.trim()) return;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    preview.clear();
    try {
      const src = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      const removeSet = new Set(parsePageSelection(pagesToDelete, src.getPageCount()));

      if (removeSet.size === 0) {
        throw new Error("Enter valid page numbers to delete, e.g. 2, 4-6");
      }
      if (removeSet.size >= src.getPageCount()) {
        throw new Error("Cannot delete every page from the document");
      }

      const keep = src.getPageIndices().filter((idx) => !removeSet.has(idx));
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, keep);
      copied.forEach((page) => out.addPage(page));
      const saved = await out.save();
      setOutputUrl(toObjectUrl(saved));
      await preview.fromBytes(saved);
    } catch (err) {
      setError(friendlyPdfError(err, "Failed to delete pages"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          preview.clear();
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a PDF, then list the pages to remove"
      />
      {file && (
        <div className="space-y-4">
          <Input
            label={`Pages to delete (1–${pageCount || "?"})`}
            helperText="Comma-separated numbers or ranges, e.g. 1, 3, 5-7"
            value={pagesToDelete}
            onChange={(e) => setPagesToDelete(e.target.value)}
            mono
          />
          <Button
            variant="primary"
            onClick={handleDelete}
            loading={processing}
            disabled={!pagesToDelete.trim()}
          >
            Delete selected pages
          </Button>
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="Pages removed"
              status="done"
              downloadFileName={`${baseName(file.name)}-trimmed.pdf`}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <SuccessBody
                label="Pages deleted"
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 3. Rotate PDF ─────────────────────────────────────────────────────── */

export const RotatePdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [angle, setAngle] = useState("90");
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const [previewUrl, setPreviewUrl] = useObjectUrlState();
  const [pageCount, setPageCount] = useState(0);
  const [appliedAngle, setAppliedAngle] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];

  const reset = () => {
    setFiles([]);
    setOutputUrl(null);
    setPreviewUrl(null);
    setPageCount(0);
    setAppliedAngle(null);
    setError(null);
  };

  const handleRotate = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    setPreviewUrl(null);
    setAppliedAngle(null);
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      const rotationAngle = parseInt(angle, 10);
      if (![90, 180, 270].includes(rotationAngle)) {
        throw new Error("Choose 90°, 180°, or 270°");
      }

      const count = pdf.getPageCount();
      setPageCount(count);

      pdf.getPages().forEach((page) => {
        const current = page.getRotation().angle;
        // Normalize to 0/90/180/270 (JS % can be negative)
        const next = (((current + rotationAngle) % 360) + 360) % 360;
        page.setRotation(degrees(next));
      });

      const saved = await pdf.save();
      setOutputUrl(toObjectUrl(saved));
      setAppliedAngle(rotationAngle);

      // Preview page 1 so rotation is visible without downloading
      try {
        const { renderPdfPageToBlob } = await import("@/lib/pdf-client");
        const copy = new Uint8Array(saved);
        const preview = await renderPdfPageToBlob(copy.buffer, 1, "png", 1.25);
        setPreviewUrl(URL.createObjectURL(preview));
      } catch {
        // Preview is optional; download still works
      }
    } catch (err) {
      setError(friendlyPdfError(err, "Could not rotate this PDF"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          setPreviewUrl(null);
          setAppliedAngle(null);
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a PDF to rotate every page"
      />
      {file && (
        <div className="space-y-4">
          <Select
            label="Rotation angle"
            value={angle}
            onChange={(e) => {
              setAngle(e.target.value);
              setOutputUrl(null);
              setPreviewUrl(null);
              setAppliedAngle(null);
            }}
            options={[
              { value: "90", label: "90° clockwise" },
              { value: "180", label: "180°" },
              { value: "270", label: "270° (90° counter-clockwise)" },
            ]}
          />
          <Button variant="primary" onClick={handleRotate} loading={processing}>
            Rotate all pages
          </Button>
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="Rotated PDF"
              status="done"
              statusText={
                appliedAngle != null
                  ? `+${appliedAngle}° · ${pageCount} page${pageCount === 1 ? "" : "s"}`
                  : undefined
              }
              downloadFileName={`${baseName(file.name)}-rotated.pdf`}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <div className="flex flex-col items-center gap-3 py-2">
                <Badge variant="success" size="md">
                  Rotation applied (+{appliedAngle}°)
                </Badge>
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Rotated page 1 preview"
                    className="max-h-72 w-auto rounded-[10px] border border-[var(--line)] bg-[var(--surface-sunk)] object-contain"
                  />
                ) : (
                  <p className="text-xs text-[var(--ink-soft)]">
                    Download the PDF and open it to confirm orientation.
                  </p>
                )}
                <p className="text-center text-xs text-[var(--ink-faint)]">
                  Page 1 preview · all pages rotated the same amount
                </p>
              </div>
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 4. Watermark PDF ──────────────────────────────────────────────────── */

export const WatermarkPdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [fontSize, setFontSize] = useState(48);
  const [angle, setAngle] = useState(45);
  const [tile, setTile] = useState("single");
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];

  const reset = () => {
    setFiles([]);
    setOutputUrl(null);
    preview.clear();
    setError(null);
  };

  const handleWatermark = async () => {
    if (!file || !text.trim()) return;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    preview.clear();
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const safeText = text.replace(/[^\x20-\x7E]/g, "?");

      pdf.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(safeText, fontSize);
        const draw = (x: number, y: number) => {
          page.drawText(safeText, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(0.75, 0.2, 0.2),
            opacity: opacity / 100,
            rotate: degrees(angle),
          });
        };

        if (tile === "tiled") {
          const stepX = Math.max(textWidth * 0.7, 160);
          const stepY = Math.max(fontSize * 2.5, 120);
          for (let y = stepY / 2; y < height; y += stepY) {
            for (let x = 40; x < width; x += stepX) {
              draw(x, y);
            }
          }
        } else {
          draw(Math.max(24, (width - textWidth) / 2), height / 2);
        }
      });

      const saved = await pdf.save();
      setOutputUrl(toObjectUrl(saved));
      await preview.fromBytes(saved);
    } catch (err) {
      setError(friendlyPdfError(err, "Could not watermark this PDF"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          preview.clear();
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a PDF, then set watermark text and style"
      />
      {file && (
        <div className="space-y-4">
          <Input
            label="Watermark text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Opacity" min={10} max={90} value={opacity} onChange={setOpacity} unit="%" />
            <Slider label="Font size" min={18} max={96} value={fontSize} onChange={setFontSize} unit="pt" />
            <Slider label="Angle" min={0} max={90} value={angle} onChange={setAngle} unit="°" />
            <Select
              label="Placement"
              value={tile}
              onChange={(e) => setTile(e.target.value)}
              options={[
                { value: "single", label: "Centered diagonal" },
                { value: "tiled", label: "Tiled across page" },
              ]}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleWatermark}
            loading={processing}
            disabled={!text.trim()}
          >
            Apply watermark
          </Button>
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="Watermarked PDF"
              status="done"
              downloadFileName={`${baseName(file.name)}-watermarked.pdf`}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <SuccessBody
                label="Watermark applied"
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 5. Sign PDF ───────────────────────────────────────────────────────── */

export const SignPdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [sigMode, setSigMode] = useState<"type" | "draw">("type");
  const [sigText, setSigText] = useState("John Doe");
  const [pageChoice, setPageChoice] = useState("last");
  const [pageCount, setPageCount] = useState(0);
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const file = files[0];

  useEffect(() => {
    let cancelled = false;
    async function meta() {
      if (!file) {
        setPageCount(0);
        return;
      }
      try {
        const pdf = await PDFDocument.load(await file.arrayBuffer(), {
          ignoreEncryption: true,
        });
        if (!cancelled) setPageCount(pdf.getPageCount());
      } catch {
        if (!cancelled) setError("Could not read PDF");
      }
    }
    void meta();
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sigMode !== "draw") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1B1A17";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [sigMode, file]);

  const reset = () => {
    setFiles([]);
    setOutputUrl(null);
    preview.clear();
    setError(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleSign = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    preview.clear();
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      const pages = pdf.getPages();
      const idx =
        pageChoice === "first"
          ? 0
          : pageChoice === "last"
            ? pages.length - 1
            : Math.min(pages.length - 1, Math.max(0, parseInt(pageChoice, 10) - 1));
      const page = pages[idx];
      const { width } = page.getSize();

      if (sigMode === "type") {
        if (!sigText.trim()) throw new Error("Enter a signature name");
        const font = await pdf.embedFont(StandardFonts.HelveticaOblique);
        const label = `Signed by: ${sigText.replace(/[^\x20-\x7E]/g, "?")}`;
        page.drawText(label, {
          x: Math.max(24, width - 260),
          y: 36,
          size: 14,
          font,
          color: rgb(0.1, 0.1, 0.45),
        });
      } else {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Signature pad unavailable");
        const dataUrl = canvas.toDataURL("image/png");
        const pngBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
        const image = await pdf.embedPng(pngBytes);
        const sigW = 160;
        const sigH = (image.height / image.width) * sigW;
        page.drawImage(image, {
          x: width - sigW - 36,
          y: 28,
          width: sigW,
          height: sigH,
        });
      }

      const saved = await pdf.save();
      setOutputUrl(toObjectUrl(saved));
      await preview.fromBytes(saved);
    } catch (err) {
      setError(friendlyPdfError(err, "Could not sign this PDF"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          preview.clear();
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a PDF, then type or draw a signature"
      />
      {file && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Signature style"
              value={sigMode}
              onChange={(e) => setSigMode(e.target.value as "type" | "draw")}
              options={[
                { value: "type", label: "Typed name" },
                { value: "draw", label: "Draw signature" },
              ]}
            />
            <Select
              label="Place on page"
              value={pageChoice}
              onChange={(e) => setPageChoice(e.target.value)}
              options={[
                { value: "last", label: "Last page" },
                { value: "first", label: "First page" },
                ...Array.from({ length: Math.min(pageCount, 20) }, (_, i) => ({
                  value: String(i + 1),
                  label: `Page ${i + 1}`,
                })),
              ]}
            />
          </div>

          {sigMode === "type" ? (
            <Input
              label="Signature name"
              value={sigText}
              onChange={(e) => setSigText(e.target.value)}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Draw signature
              </p>
              <canvas
                ref={canvasRef}
                width={480}
                height={160}
                className="w-full max-w-lg touch-none rounded-[10px] border border-[var(--line-strong)] bg-white"
                onPointerDown={(e) => {
                  drawing.current = true;
                  const ctx = canvasRef.current?.getContext("2d");
                  if (!ctx) return;
                  const { x, y } = pointerPos(e);
                  ctx.beginPath();
                  ctx.moveTo(x, y);
                  (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!drawing.current) return;
                  const ctx = canvasRef.current?.getContext("2d");
                  if (!ctx) return;
                  const { x, y } = pointerPos(e);
                  ctx.lineTo(x, y);
                  ctx.stroke();
                }}
                onPointerUp={() => {
                  drawing.current = false;
                }}
              />
              <Button variant="secondary" size="sm" onClick={clearCanvas}>
                Clear pad
              </Button>
            </div>
          )}

          <Button variant="primary" onClick={handleSign} loading={processing}>
            Apply signature
          </Button>
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="Signed PDF"
              status="done"
              downloadFileName={`${baseName(file.name)}-signed.pdf`}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <SuccessBody
                label="Signature added"
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 6. Protect PDF ────────────────────────────────────────────────────── */

export const ProtectPdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];

  const reset = () => {
    setFiles([]);
    setPassword("");
    setConfirm("");
    setOutputUrl(null);
    preview.clear();
    setError(null);
  };

  const handleProtect = async () => {
    if (!file || !password) return;
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    preview.clear();
    try {
      const { PDFDocument: EncryptablePDFDocument } = await import("@cantoo/pdf-lib");
      const pdf = await EncryptablePDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      pdf.encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: {
          printing: "highResolution",
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: true,
          documentAssembly: false,
        },
      });
      const pdfBytes = await pdf.save({ useObjectStreams: false });
      setOutputUrl(URL.createObjectURL(toPdfBlob(pdfBytes)));
      await preview.fromBytes(pdfBytes);
    } catch (err) {
      setError(friendlyPdfError(err, "Failed to encrypt PDF"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote>
        Password encryption runs in your browser. Only protect PDFs you own or
        have permission to lock. Passwords are never stored.
      </PrivacyNote>
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          preview.clear();
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a PDF to add password protection"
      />
      {file && (
        <div className="space-y-4">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          <Button
            variant="primary"
            onClick={handleProtect}
            loading={processing}
            disabled={!password || !confirm}
          >
            Encrypt & protect PDF
          </Button>
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="Encrypted PDF"
              status="done"
              downloadFileName={`${baseName(file.name)}-protected.pdf`}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <SuccessBody
                label="Password protection added"
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 7. Rearrange PDF ──────────────────────────────────────────────────── */

export const RearrangePdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [pageOrder, setPageOrder] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];

  useEffect(() => {
    let cancelled = false;
    async function loadMeta() {
      if (!file) {
        setPageCount(0);
        setPageOrder("");
        return;
      }
      try {
        const pdf = await PDFDocument.load(await file.arrayBuffer(), {
          ignoreEncryption: true,
        });
        const count = pdf.getPageCount();
        if (cancelled) return;
        setPageCount(count);
        setPageOrder(Array.from({ length: count }, (_, i) => i + 1).join(", "));
      } catch {
        if (!cancelled) setError("Could not read PDF");
      }
    }
    void loadMeta();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const reset = () => {
    setFiles([]);
    setPageOrder("");
    setOutputUrl(null);
    preview.clear();
    setError(null);
  };

  const handleRearrange = async () => {
    if (!file || !pageOrder.trim()) return;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    preview.clear();
    try {
      const src = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      const pages = pageOrder
        .split(",")
        .map((p) => parseInt(p.trim(), 10) - 1)
        .filter((idx) => !Number.isNaN(idx) && idx >= 0 && idx < pageCount);

      if (pages.length === 0) {
        throw new Error("Enter a valid page order, e.g. 3, 1, 2");
      }

      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, pages);
      copied.forEach((page) => out.addPage(page));
      const saved = await out.save();
      setOutputUrl(toObjectUrl(saved));
      await preview.fromBytes(saved);
    } catch (err) {
      setError(friendlyPdfError(err, "Could not rearrange pages"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          preview.clear();
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a PDF, then edit the page order list"
      />
      {file && pageCount > 0 && (
        <div className="space-y-4">
          <Input
            label={`New page order (1–${pageCount})`}
            helperText="Comma-separated page numbers in the desired order, e.g. 3, 1, 2"
            value={pageOrder}
            onChange={(e) => setPageOrder(e.target.value)}
            mono
          />
          <Button variant="primary" onClick={handleRearrange} loading={processing}>
            Apply new page order
          </Button>
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="Rearranged PDF"
              status="done"
              downloadFileName={`${baseName(file.name)}-rearranged.pdf`}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <SuccessBody
                label="Pages reordered"
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 8. PDF → Image ────────────────────────────────────────────────────── */

export const PdfToImageTool: React.FC<{ lockedFormat?: "png" | "jpg" }> = ({
  lockedFormat,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<"png" | "jpg">(lockedFormat ?? "png");
  const [scale, setScale] = useState(2);
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [zipUrl, setZipUrl] = useObjectUrlState();
  const [singleUrl, setSingleUrl] = useObjectUrlState();
  const [singleName, setSingleName] = useState("page.png");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);

  const file = files[0];
  const activeFormat = lockedFormat ?? format;

  const clearImages = () => {
    setImages((prev) => {
      prev.forEach((img) => revokeObjectUrl(img.url));
      return [];
    });
    setZipUrl(null);
    setSingleUrl(null);
    setPageCount(0);
  };

  const reset = () => {
    setFiles([]);
    clearImages();
    setError(null);
    setTip(null);
    setProgress(0);
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    clearImages();
    setError(null);
    setTip(null);
    setProgress(0);

    try {
      const { convertPdfToImages } = await import("@/lib/pdf-client");
      // Large files: prefer lower peak memory
      const largeFile = file.size > 25 * 1024 * 1024;
      const effectiveScale = largeFile && scale > 1.5 ? 1.25 : scale;
      if (largeFile && effectiveScale !== scale) {
        setTip(
          "Large PDF detected — using a lower render scale to avoid running out of memory. Switch to JPG + Draft (1×) for the safest convert.",
        );
      }

      const bytes = await file.arrayBuffer();
      const result = await convertPdfToImages(bytes, {
        format: activeFormat,
        scale: effectiveScale,
        stem: baseName(file.name),
        maxPreviewPages: 8,
        maxEdgePx: largeFile ? 2560 : 4096,
        onProgress: (done, total) => {
          setProgress(Math.round((done / total) * 100));
        },
      });

      setPageCount(result.pageCount);
      setImages(result.preview);

      if (result.single) {
        setSingleName(result.single.name);
        setSingleUrl(URL.createObjectURL(result.single.blob));
      } else if (result.zipBlob) {
        setZipUrl(URL.createObjectURL(result.zipBlob));
      }

      if (result.pageCount > result.preview.length) {
        setTip(
          (prev) =>
            prev ??
            `Showing ${result.preview.length} of ${result.pageCount} pages as preview. Download the ZIP for every page.`,
        );
      }
    } catch (err) {
      setError(friendlyPdfError(err, "Failed to convert PDF pages"));
    } finally {
      setProcessing(false);
    }
  };

  const downloadUrl =
    pageCount <= 1 ? singleUrl || images[0]?.url : zipUrl || undefined;
  const downloadName =
    pageCount <= 1
      ? singleName || images[0]?.name || "page.png"
      : `${baseName(file?.name || "pages")}-pages.zip`;

  return (
    <div className="space-y-6">
      <PrivacyNote>
        Large or many-page PDFs stay in your browser. Prefer JPG + Draft quality
        for big files — PNG at high scale can run out of memory.
      </PrivacyNote>
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          clearImages();
          setError(null);
          setTip(null);
          const nextFile = next[0];
          if (nextFile && nextFile.size > 25 * 1024 * 1024) {
            setScale(1);
            setTip(
              lockedFormat === "png"
                ? "Large PDF detected — quality set to Draft (1×). For fewer memory issues on big files, use PDF to JPG instead."
                : "Large PDF detected — quality set to Draft (1×). JPG uses less memory than PNG.",
            );
            if (!lockedFormat) setFormat("jpg");
          }
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        maxSizeMB={Infinity}
        hint={`Upload a PDF to render pages as ${activeFormat.toUpperCase()} images — up to 40 MB and 50 pages`}
      />
      {file && (
        <div className="space-y-4">
          {!lockedFormat && (
            <Select
              label="Output format"
              value={format}
              onChange={(e) => setFormat(e.target.value as "png" | "jpg")}
              options={[
                { value: "png", label: "PNG (lossless, more memory)" },
                { value: "jpg", label: "JPG (smaller, recommended for big PDFs)" },
              ]}
            />
          )}
          <Select
            label="Render quality"
            value={String(scale)}
            onChange={(e) => setScale(Number(e.target.value))}
            options={[
              { value: "1", label: "Draft (1×) — best for large PDFs" },
              { value: "2", label: "Standard (2×)" },
              { value: "3", label: "High (3×)" },
            ]}
          />
          <Button variant="primary" onClick={handleConvert} loading={processing}>
            Convert PDF pages
          </Button>
          {processing && <ProgressBar value={progress} label={`${progress}%`} />}
          <ErrorNote message={error} />
          {tip && !error && (
            <Card variant="sunk" className="px-4 py-3 text-xs text-[var(--ink-soft)]">
              {tip}
            </Card>
          )}
          {images.length > 0 && downloadUrl && (
            <ResultPanel
              title={
                pageCount > 1
                  ? `${pageCount} page image${pageCount === 1 ? "" : "s"}`
                  : "Page image"
              }
              status="done"
              downloadFileName={downloadName}
              downloadBlobUrl={downloadUrl}
              onClear={reset}
            >
              <div className="space-y-3">
                {pageCount > images.length && (
                  <p className="text-center font-mono text-[11px] text-[var(--ink-faint)]">
                    Preview {images.length} of {pageCount} pages · full set in download
                  </p>
                )}
                <div className="flex flex-wrap justify-center gap-3">
                  {images.map((img) => (
                    <a
                      key={img.name}
                      href={img.url}
                      download={img.name}
                      className="block overflow-hidden rounded-[10px] border border-[var(--line)] transition-opacity hover:opacity-90"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-40 w-auto bg-[var(--surface-sunk)] object-contain"
                      />
                      <span className="block px-2 py-1 text-center font-mono text-[10px] text-[var(--ink-soft)]">
                        {img.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 9. Compress PDF ───────────────────────────────────────────────────── */

export const CompressPdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<"high" | "medium" | "low">("medium");
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [newSize, setNewSize] = useState<number | null>(null);
  const [method, setMethod] = useState<"image" | "lossless" | "original" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];

  const reset = () => {
    setFiles([]);
    setOutputUrl(null);
    preview.clear();
    setNewSize(null);
    setMethod(null);
    setError(null);
    setProgress(0);
  };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    preview.clear();
    setNewSize(null);
    setMethod(null);
    setProgress(0);

    try {
      const settings = {
        high: { scale: 1.5, quality: 0.82 },
        medium: { scale: 1.15, quality: 0.68 },
        low: { scale: 0.9, quality: 0.52 },
      }[level];

      const { loadPdfDocument } = await import("@/lib/pdf-client");
      const bytes = await file.arrayBuffer();
      const src = await loadPdfDocument(bytes);
      const out = await PDFDocument.create();

      for (let i = 1; i <= src.numPages; i += 1) {
        const page = await src.getPage(i);
        const viewport = page.getViewport({ scale: settings.scale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not create canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        const jpegBlob: Blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("JPEG encode failed"))),
            "image/jpeg",
            settings.quality,
          );
        });

        const jpg = await out.embedJpg(await jpegBlob.arrayBuffer());
        const pdfPage = out.addPage([jpg.width, jpg.height]);
        pdfPage.drawImage(jpg, {
          x: 0,
          y: 0,
          width: jpg.width,
          height: jpg.height,
        });
        setProgress(Math.round((i / src.numPages) * 100));
      }

      let finalBytes: Uint8Array = await out.save({ useObjectStreams: true });
      let finalMethod: "image" | "lossless" | "original" = "image";

      // Rasterizing can bloat already-efficient, mostly-text PDFs. Never ship
      // a "compressed" file that's larger than the original.
      if (finalBytes.byteLength >= file.size) {
        const lossless = await PDFDocument.load(bytes, { ignoreEncryption: true });
        lossless.setTitle("");
        lossless.setAuthor("");
        lossless.setSubject("");
        lossless.setKeywords([]);
        lossless.setProducer("");
        lossless.setCreator("");
        const losslessBytes = await lossless.save({ useObjectStreams: true });

        if (losslessBytes.byteLength < finalBytes.byteLength) {
          finalBytes = losslessBytes;
          finalMethod = "lossless";
        }

        if (finalBytes.byteLength >= file.size) {
          finalBytes = new Uint8Array(bytes);
          finalMethod = "original";
        }
      }

      const blob = toPdfBlob(finalBytes);
      setNewSize(blob.size);
      setMethod(finalMethod);
      setOutputUrl(URL.createObjectURL(blob));
      await preview.fromBytes(finalBytes);
    } catch (err) {
      setError(friendlyPdfError(err, "Could not compress this PDF"));
    } finally {
      setProcessing(false);
    }
  };

  const savings =
    file && newSize != null
      ? Math.round(((file.size - newSize) / file.size) * 100)
      : null;

  return (
    <div className="space-y-6">
      <PrivacyNote>
        Compression re-encodes each page as a JPEG and rebuilds the PDF in your
        browser, so text becomes non-selectable. If that would make the file
        larger (common for text-heavy PDFs), a lossless fallback is used instead.
      </PrivacyNote>
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          preview.clear();
          setNewSize(null);
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a PDF to reduce file size"
      />
      {file && (
        <div className="space-y-4">
          <Select
            label="Compression level"
            value={level}
            onChange={(e) => setLevel(e.target.value as typeof level)}
            options={[
              { value: "high", label: "High quality (lighter shrink)" },
              { value: "medium", label: "Balanced" },
              { value: "low", label: "Smallest file (more loss)" },
            ]}
          />
          <p className="font-mono text-xs text-[var(--ink-faint)]">
            Original size: {formatBytes(file.size)}
          </p>
          <Button variant="primary" onClick={handleCompress} loading={processing}>
            Compress PDF
          </Button>
          {processing && <ProgressBar value={progress} label={`${progress}%`} />}
          <ErrorNote message={error} />
          {outputUrl && newSize != null && (
            <ResultPanel
              title="Compressed PDF"
              status="done"
              downloadFileName={`${baseName(file.name)}-compressed.pdf`}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <SuccessBody
                label="PDF compressed"
                detail={
                  <div className="space-y-2">
                    <span className="block font-mono">
                      {formatBytes(file.size)} → {formatBytes(newSize)}
                      {savings != null ? ` (${savings > 0 ? `−${savings}%` : "similar size"})` : ""}
                    </span>
                    {method === "lossless" && (
                      <span className="block text-[var(--ink-faint)]">
                        This PDF was already efficient — text stayed selectable and only metadata was stripped.
                      </span>
                    )}
                    {method === "original" && (
                      <span className="block text-[var(--ink-faint)]">
                        This PDF is already about as small as it can get — the original was kept unchanged.
                      </span>
                    )}
                  </div>
                }
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 10. Unlock PDF ────────────────────────────────────────────────────── */

export const UnlockPdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];

  const reset = () => {
    setFiles([]);
    setPassword("");
    setOutputUrl(null);
    preview.clear();
    setError(null);
  };

  const handleUnlock = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    preview.clear();
    try {
      const bytes = await file.arrayBuffer();
      const pdfBytes = await unlockPdfBytes(bytes, password.trim() || undefined);
      setOutputUrl(URL.createObjectURL(toPdfBlob(pdfBytes)));
      await preview.fromBytes(pdfBytes);
    } catch (err) {
      setError(
        friendlyPdfError(
          err,
          "Could not unlock this PDF. Try the correct password — strongly encrypted files may not be removable in-browser.",
        ),
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote>
        Only unlock PDFs you own or have permission to open. The password is used
        locally and never stored or uploaded.
      </PrivacyNote>
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          preview.clear();
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a password-protected PDF"
      />
      {file && (
        <div className="space-y-4">
          <Input
            label="PDF password"
            type="password"
            placeholder="Required if the file asks for a password to open"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <p className="text-xs text-[var(--ink-faint)]">
            Enter the open password when the PDF is locked. Permission-only
            locks (print/copy restricted) can usually be cleared without one.
          </p>
          <Button variant="primary" onClick={handleUnlock} loading={processing}>
            Unlock & download
          </Button>
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="Unlocked PDF"
              status="done"
              downloadFileName={`${baseName(file.name)}-unlocked.pdf`}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <SuccessBody
                label="Restrictions removed"
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 11. Edit PDF ──────────────────────────────────────────────────────── */

export const EditPdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [addText, setAddText] = useState("APPROVED");
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState("#2F855A");
  const [boxWidth, setBoxWidth] = useState(160);
  const [boxHeight, setBoxHeight] = useState(32);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(100);
  const [mode, setMode] = useState<"text" | "whiteout">("text");
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const preview = usePdfPreviewUrls();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = files[0];

  useEffect(() => {
    let cancelled = false;
    async function meta() {
      if (!file) {
        setPageCount(0);
        return;
      }
      try {
        const pdf = await PDFDocument.load(await file.arrayBuffer(), {
          ignoreEncryption: true,
        });
        if (!cancelled) {
          setPageCount(pdf.getPageCount());
          setPageNumber(1);
        }
      } catch {
        if (!cancelled) setError("Could not read PDF");
      }
    }
    void meta();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const reset = () => {
    setFiles([]);
    setOutputUrl(null);
    preview.clear();
    setError(null);
  };

  const handleApplyEdit = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    preview.clear();
    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      const pages = pdf.getPages();
      const idx = Math.min(pages.length, Math.max(1, pageNumber)) - 1;
      const page = pages[idx];
      const { r, g, b } = hexToRgb(textColor);

      if (mode === "whiteout") {
        page.drawRectangle({
          x: posX,
          y: page.getHeight() - posY - boxHeight,
          width: boxWidth,
          height: boxHeight,
          color: rgb(1, 1, 1),
        });
      } else {
        if (!addText.trim()) throw new Error("Enter overlay text");
        const font = await pdf.embedFont(StandardFonts.HelveticaBold);
        page.drawText(addText.replace(/[^\x20-\x7E]/g, "?"), {
          x: posX,
          y: page.getHeight() - posY,
          size: textSize,
          font,
          color: rgb(r, g, b),
        });
      }

      const saved = await pdf.save();
      setOutputUrl(toObjectUrl(saved));
      await preview.fromBytes(saved);
    } catch (err) {
      setError(friendlyPdfError(err, "Could not edit this PDF"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          setFiles(next);
          setOutputUrl(null);
          preview.clear();
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a PDF to add text overlays or whiteout boxes"
      />
      {file && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Edit mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as "text" | "whiteout")}
              options={[
                { value: "text", label: "Add text overlay" },
                { value: "whiteout", label: "Whiteout / redact box" },
              ]}
            />
            <Slider
              label="Page"
              min={1}
              max={Math.max(1, pageCount)}
              value={Math.min(pageNumber, Math.max(1, pageCount))}
              onChange={setPageNumber}
            />
          </div>
          {mode === "text" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Overlay text"
                value={addText}
                onChange={(e) => setAddText(e.target.value)}
              />
              <Input
                label="Text color"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Slider label="Box width" min={40} max={500} value={boxWidth} onChange={setBoxWidth} unit="px" />
              <Slider label="Box height" min={10} max={200} value={boxHeight} onChange={setBoxHeight} unit="px" />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            {mode === "text" && (
              <Slider label="Text size" min={10} max={72} value={textSize} onChange={setTextSize} unit="pt" />
            )}
            <Slider label="X from left" min={10} max={500} value={posX} onChange={setPosX} unit="px" />
            <Slider label="Y from top" min={10} max={700} value={posY} onChange={setPosY} unit="px" />
          </div>
          <Button variant="primary" onClick={handleApplyEdit} loading={processing}>
            Apply to PDF
          </Button>
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="Edited PDF"
              status="done"
              downloadFileName={`${baseName(file.name)}-edited.pdf`}
              downloadBlobUrl={outputUrl}
              onClear={reset}
            >
              <SuccessBody
                label="Annotations applied"
                previewUrls={preview.urls}
                previewPageCount={preview.pageCount}
              />
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── 12. OCR PDF ───────────────────────────────────────────────────────── */

export const OcrPdfTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [outputMode, setOutputMode] = useState<"pdf" | "txt">("pdf");
  const [outputUrl, setOutputUrl] = useObjectUrlState();
  const [outputName, setOutputName] = useState("ocr-result.pdf");
  const [previewText, setPreviewText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeRun = useRef<AbortController | null>(null);
  useEffect(() => () => { activeRun.current?.abort(); }, []);
  const file = files[0];

  const reset = () => {
    activeRun.current?.abort();
    setFiles([]);
    setOutputUrl(null);
    setPreviewText("");
    setError(null);
    setProgress(0);
    setStatus("");
  };

  const handleOcr = async () => {
    if (!file || processing) return;
    const controller = new AbortController();
    activeRun.current?.abort();
    activeRun.current = controller;
    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    setPreviewText("");
    setProgress(0);
    setStatus("Loading OCR engine…");

    try {
      const { ocrPdfPagesToText } = await import("@/lib/pdf-ocr");
      const bytes = await file.arrayBuffer();
      const stem = baseName(file.name);
      const outPdf = await PDFDocument.create();
      const font = await outPdf.embedFont(StandardFonts.Helvetica);
      const pageTexts = await ocrPdfPagesToText(bytes, (message, percent) => {
        setStatus(message);
        if (percent !== undefined) setProgress(percent);
      }, async ({ text, image: imageBlob, width, height }) => {
        if (outputMode !== "pdf") return;
        const image = await outPdf.embedPng(await imageBlob.arrayBuffer());
        const page = outPdf.addPage([width, height]);
        page.drawImage(image, { x: 0, y: 0, width, height });
        // Preserve every recognized line in a fully invisible text layer.
        // This enables searching; it does not reproduce exact selection boxes.
        const lines = text.split(/\n/);
        const lineHeight = Math.min(12, (height - 24) / Math.max(1, lines.length));
        for (let index = 0; index < lines.length; index++) {
          const safe = lines[index].replace(/[^\x20-\x7E]/g, " ");
          if (!safe.trim()) continue;
          page.drawText(safe, { x: 12, y: Math.max(1, height - 12 - index * lineHeight),
            size: Math.min(10, lineHeight), font, color: rgb(0, 0, 0), opacity: 0 });
        }
      }, controller.signal);
      if (controller.signal.aborted) return;

      const fullText = pageTexts.join("\n\n").trim();
      if (!fullText) {
        throw new Error("No text detected. Try a clearer scan or higher-contrast PDF.");
      }

      setPreviewText(fullText.slice(0, 1600));

      if (outputMode === "txt") {
        const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
        setOutputName(`${stem}-ocr.txt`);
        setOutputUrl(URL.createObjectURL(blob));
      } else {
        const saved = await outPdf.save();
        setOutputName(`${stem}-ocr.pdf`);
        setOutputUrl(toObjectUrl(saved));
      }
      setStatus("Done");
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(friendlyPdfError(err, "OCR failed"));
      setStatus("");
    } finally {
      if (activeRun.current === controller) setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PrivacyNote>
        English OCR runs in your browser using self-hosted assets. Up to 10 pages
        per run; keep this tab open. Accuracy depends on scan quality. Searchable
        PDFs preserve the page image, with approximate text selection positions.
      </PrivacyNote>
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          activeRun.current?.abort();
          setFiles(next);
          setOutputUrl(null);
          setPreviewText("");
          setError(null);
        }}
        accept="application/pdf,.pdf"
        multiple={false}
        hint="Upload a scanned or image-based PDF"
      />
      {file && (
        <div className="space-y-4">
          <Select
            label="Output"
            value={outputMode}
            onChange={(e) => setOutputMode(e.target.value as "pdf" | "txt")}
            options={[
              { value: "pdf", label: "Searchable PDF (image + text layer)" },
              { value: "txt", label: "Plain text (.txt)" },
            ]}
          />
          <Button variant="primary" onClick={handleOcr} loading={processing}>
            Run OCR
          </Button>
          {(processing || status) && (
            <div className="space-y-2">
              <ProgressBar value={progress} label={status || `${progress}%`} />
            </div>
          )}
          <ErrorNote message={error} />
          {outputUrl && (
            <ResultPanel
              title="OCR result"
              status="done"
              downloadFileName={outputName}
              downloadBlobUrl={outputUrl}
              copyValue={previewText || undefined}
              onClear={reset}
            >
              <div className="space-y-3">
                <div className="text-center">
                  <Badge variant="success" size="md">
                    Ready: {outputName}
                  </Badge>
                </div>
                {previewText && (
                  <pre className="max-h-56 overflow-auto rounded-[10px] bg-[var(--surface-sunk)] p-3 text-left font-mono text-xs whitespace-pre-wrap text-[var(--ink-soft)]">
                    {previewText}
                    {previewText.length >= 1600 ? "…" : ""}
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
