import { PDFDocument } from "pdf-lib";
import { validateDocumentFile } from "@/lib/pdf-ops";

export const MAX_OFFICE_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_OFFICE_PDF_BYTES = 20 * 1024 * 1024;
export const OFFICE_TOOL_FORMATS = { "word-to-pdf": "docx", "excel-to-pdf": "xlsx", "powerpoint-to-pdf": "pptx" } as const;
export type OfficeFormat = typeof OFFICE_TOOL_FORMATS[keyof typeof OFFICE_TOOL_FORMATS];
export class OfficeConversionError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function officeConverterConfiguration() {
  try {
    const value = process.env.OFFICE_CONVERTER_URL?.trim();
    if (!value) return null;
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    const authorization = process.env.OFFICE_CONVERTER_AUTH_HEADER?.trim();
    if (authorization && (authorization.length > 2048 || /[\r\n\x00-\x1f\x7f]/.test(authorization))) return null;
    const rawTimeout = process.env.OFFICE_CONVERTER_TIMEOUT_MS?.trim();
    const timeoutMs = rawTimeout ? Number(rawTimeout) : 30000;
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) return null;
    return { url: new URL("/forms/libreoffice/convert", url), authorization, timeoutMs };
  } catch { return null; }
}

async function readStream(stream: ReadableStream<Uint8Array> | null, maxBytes: number, expired: Promise<never>, status: number): Promise<Uint8Array> {
  if (!stream) throw new OfficeConversionError("Document body is required", status);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const item = await Promise.race([reader.read(), expired]);
      if (item.done) break;
      size += item.value.byteLength;
      if (size > maxBytes) throw new OfficeConversionError("Document exceeds the processing size limit", status);
      chunks.push(item.value);
    }
    if (!size) throw new OfficeConversionError("Document body is empty", status);
    return new Uint8Array(Buffer.concat(chunks));
  } finally { void reader.cancel().catch(() => undefined); }
}

export async function readOfficeUpload(request: Request, maxBytes = MAX_OFFICE_UPLOAD_BYTES, timeoutMs = 5000) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/octet-stream") throw new OfficeConversionError("Upload a raw Office document", 415);
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new OfficeConversionError("Document exceeds the upload size limit", 413);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new OfficeConversionError("Document upload timed out", 408)), timeoutMs); });
  try { return await readStream(request.body, maxBytes, expired, 413); }
  finally { clearTimeout(timer); }
}

let activeConversions = 0;
export async function convertNativeOffice(bytes: Uint8Array, format: OfficeFormat, options: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<Uint8Array> {
  const configuration = officeConverterConfiguration();
  if (!configuration) throw new OfficeConversionError("Server document conversion is unavailable", 503);
  if (activeConversions >= 2) throw new OfficeConversionError("Document converter is busy; try again shortly", 429);
  activeConversions++;
  const controller = new AbortController();
  let rejectExpired: (error: OfficeConversionError) => void = () => undefined;
  const expired = new Promise<never>((_, reject) => { rejectExpired = reject; });
  const abort = () => { controller.abort(); rejectExpired(new OfficeConversionError("Document conversion timed out or was cancelled", 504)); };
  const timeoutMs = Math.min(configuration.timeoutMs, options.timeoutMs ?? configuration.timeoutMs);
  const timer = setTimeout(abort, timeoutMs);
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    if (options.signal?.aborted) throw new OfficeConversionError("Document conversion was cancelled", 504);
    if (!bytes.byteLength || bytes.byteLength > MAX_OFFICE_UPLOAD_BYTES || !["docx", "xlsx", "pptx"].includes(format) || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 3 || bytes[3] !== 4) throw new OfficeConversionError("Choose a valid supported Office document", 400);
    const file = new File([bytes as BlobPart], `document.${format}`);
    try { await Promise.race([validateDocumentFile(file), expired]); }
    catch (error) { if (error instanceof OfficeConversionError) throw error; throw new OfficeConversionError("Office document validation failed", 400); }
    const form = new FormData(); form.set("files", file);
    // User-controlled options, target URLs, filenames and headers are never forwarded.
    const response = await Promise.race([fetch(configuration.url, { method: "POST", body: form, redirect: "error", signal: controller.signal, headers: configuration.authorization ? { Authorization: configuration.authorization } : undefined }), expired]);
    if (!response.ok || response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/pdf") {
      void response.body?.cancel().catch(() => undefined);
      throw new OfficeConversionError("Server document conversion failed", 502);
    }
    const length = response.headers.get("content-length");
    if (length && (!/^\d+$/.test(length) || Number(length) > MAX_OFFICE_PDF_BYTES)) {
      void response.body?.cancel().catch(() => undefined);
      throw new OfficeConversionError("Converted document exceeds the output size limit", 502);
    }
    const pdf = await readStream(response.body, MAX_OFFICE_PDF_BYTES, expired, 502);
    if (Buffer.from(pdf.subarray(0, 5)).toString("ascii") !== "%PDF-") throw new OfficeConversionError("Server returned an invalid PDF document", 502);
    try {
      const document = await Promise.race([PDFDocument.load(pdf), expired]);
      const pages = document.getPages();
      if (!pages.length || document.isEncrypted) throw new Error("Unsupported PDF");
      for (const page of pages) {
        const { width, height } = page.getSize();
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error("Invalid page dimensions");
      }
    } catch (error) { if (error instanceof OfficeConversionError) throw error; throw new OfficeConversionError("Converted PDF exceeds the safe page budget or is invalid", 502); }
    return pdf;
  } catch (error) {
    if (error instanceof OfficeConversionError) throw error;
    throw new OfficeConversionError("Server document conversion failed", 502);
  } finally {
    clearTimeout(timer); controller.abort(); options.signal?.removeEventListener("abort", abort); activeConversions--;
  }
}
