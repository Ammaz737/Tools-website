/** Shared PDF helpers for client-side tools. */

export function toPdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export function toObjectUrl(
  bytes: Uint8Array,
  mime = "application/pdf",
): string {
  return URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
}

export function revokeObjectUrl(url: string | null | undefined) {
  if (url) URL.revokeObjectURL(url);
}

export function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/i, "") || "document";
}

/** Parse ranges like "1-3, 5, 8-9" into 0-based page indices. */
export function parsePageSelection(
  input: string,
  totalPages: number,
): number[] {
  const indices: number[] = [];
  const seen = new Set<number>();

  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const [rawStart, rawEnd] = trimmed.split("-");
      const start = parseInt(rawStart.trim(), 10);
      const end = parseInt(rawEnd.trim(), 10);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      const from = Math.max(1, Math.min(start, end));
      const to = Math.min(totalPages, Math.max(start, end));
      for (let page = from; page <= to; page += 1) {
        if (page >= 1 && page <= totalPages && !seen.has(page - 1)) {
          seen.add(page - 1);
          indices.push(page - 1);
        }
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (
        !Number.isNaN(page) &&
        page >= 1 &&
        page <= totalPages &&
        !seen.has(page - 1)
      ) {
        seen.add(page - 1);
        indices.push(page - 1);
      }
    }
  }

  return indices;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16) / 255 || 0,
    g: parseInt(full.slice(2, 4), 16) / 255 || 0,
    b: parseInt(full.slice(4, 6), 16) / 255 || 0,
  };
}

export function friendlyPdfError(
  err: unknown,
  fallback = "Something went wrong with this PDF",
): string {
  const message = err instanceof Error ? err.message : String(err || "");
  if (/password|encrypt/i.test(message)) {
    return "This PDF is encrypted. Unlock it first, or supply the correct password.";
  }
  if (/Invalid PDF|Failed to parse/i.test(message)) {
    return "That file does not look like a valid PDF.";
  }
  if (
    /Array buffer allocation failed|Invalid array length|out of memory|OOM|allocation failed/i.test(
      message,
    )
  ) {
    return "This PDF is too large for the browser’s memory. Try JPG instead of PNG, use Draft (1×) quality, or split the PDF into smaller parts first.";
  }
  return message || fallback;
}

export const PDF_FILE_LIMIT_MB = 100;
export const PDF_COMPRESS_LIMIT_MB = 200;
export const PDF_BATCH_LIMIT_MB = 100;
export const PDF_BATCH_FILES = 25;

/** Bound the live canvas, not the sum of pages processed sequentially. */
export function pdfRenderScale(
  width: number,
  height: number,
  requestedScale: number,
  maxEdge = 4096,
  maxPixels = 8_000_000,
): number {
  if (
    ![width, height, requestedScale, maxEdge, maxPixels].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    throw new Error("This PDF has invalid page dimensions.");
  return Math.min(
    requestedScale,
    maxEdge / Math.max(width, height),
    Math.sqrt(maxPixels / width / height),
  );
}

/** Validate document structure; rendering budgets belong to each live canvas. */
export async function validatePdfBytes(
  input: ArrayBuffer | Uint8Array,
  options: { maxSizeMB?: number } = {},
): Promise<void> {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const maximum = options.maxSizeMB ?? PDF_FILE_LIMIT_MB;
  if (bytes.byteLength > maximum * 1024 * 1024)
    throw new Error(`Choose a PDF up to ${maximum} MB.`);
  if (
    new TextDecoder("ascii").decode(bytes.subarray(0, 1024)).indexOf("%PDF-") <
    0
  )
    throw new Error("That file does not look like a valid PDF.");
  const { PDFDocument } = await import("pdf-lib");
  const document = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (!document.getPageCount()) throw new Error("This PDF has no pages.");
  for (const page of document.getPages()) {
    const { width, height } = page.getSize();
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    )
      throw new Error("This PDF has invalid page dimensions.");
  }
}

export async function validateDocumentFile(file: File): Promise<void> {
  if (!file.size || file.size > 40 * 1024 * 1024)
    throw new Error("Choose a nonempty document up to 40 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (extension === "pdf") return validatePdfBytes(bytes);
  if (["docx", "xlsx", "pptx"].includes(extension ?? "")) {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b)
      throw new Error(
        "The document does not have a valid Office ZIP signature.",
      );
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(bytes);
    const entries = Object.values(zip.files);
    if (entries.length > 1000)
      throw new Error("Office archive contains too many entries.");
    let expanded = 0;
    for (const entry of entries) {
      const internal = entry as unknown as {
        _data?: { uncompressedSize?: number; compressedSize?: number };
      };
      const size = internal._data?.uncompressedSize ?? 0;
      const compressed = internal._data?.compressedSize ?? 0;
      if (
        !Number.isSafeInteger(size) ||
        size < 0 ||
        size > 40 * 1024 * 1024 ||
        (size > 1024 * 1024 && size / Math.max(1, compressed) > 200)
      )
        throw new Error("Office archive entry exceeds the expansion budget.");
      expanded += size;
    }
    if (expanded > 100 * 1024 * 1024)
      throw new Error("Office archive exceeds the 100 MB expansion budget.");
    const required =
      extension === "docx"
        ? "word/document.xml"
        : extension === "xlsx"
          ? "xl/workbook.xml"
          : "ppt/presentation.xml";
    if (!zip.file("[Content_Types].xml") || !zip.file(required))
      throw new Error("Office archive is missing required document files.");
    if (
      extension === "pptx" &&
      entries.filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name))
        .length > 50
    )
      throw new Error("Presentation exceeds the 50-slide processing limit.");
    if (extension === "xlsx") {
      const sheets = entries.filter((entry) =>
        /^xl\/worksheets\/sheet\d+\.xml$/.test(entry.name),
      );
      if (sheets.length > 20)
        throw new Error("Workbook exceeds the 20-sheet processing limit.");
      for (const sheet of sheets) {
        const xml = await sheet.async("string");
        if ((xml.match(/<c[\s>]/g) ?? []).length > 100000)
          throw new Error(
            "Worksheet exceeds the 100,000-cell processing limit.",
          );
        const references = xml.matchAll(
          /\b(?:ref|r)=["']([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?["']/g,
        );
        for (const match of references) {
          const column = (letters: string) =>
            [...letters].reduce(
              (total, character) => total * 26 + character.charCodeAt(0) - 64,
              0,
            );
          if (
            Math.max(Number(match[2]), Number(match[4] ?? 0)) > 10000 ||
            Math.max(column(match[1]), column(match[3] ?? "A")) > 100
          )
            throw new Error(
              "Worksheet exceeds the 10,000-row or 100-column processing limit.",
            );
        }
      }
    }

    return;
  }
  if (extension === "xls" || extension === "doc" || extension === "ppt") {
    const signature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    if (!signature.every((value, index) => bytes[index] === value))
      throw new Error("Legacy Office file signature is invalid.");
    return;
  }
  if (extension === "csv" || extension === "txt") {
    if (bytes.includes(0))
      throw new Error("Choose a plain UTF-8 text or CSV file.");
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return;
  }
  throw new Error("Unsupported document format.");
}
