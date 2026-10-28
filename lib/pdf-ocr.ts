"use client";

import type { Worker } from "tesseract.js";

export interface OcrPage {
  text: string;
  image: Blob;
  width: number;
  height: number;
  pageNumber: number;
}

/** English OCR, one self-hosted worker and one PDF document per operation. */
export async function ocrPdfPagesToText(
  data: ArrayBuffer,
  onProgress?: (message: string, percent?: number) => void,
  onPage?: (page: OcrPage) => Promise<void>,
  signal?: AbortSignal,
): Promise<string[]> {
  const { validatePdfBytes } = await import("@/lib/pdf-ops");
  await validatePdfBytes(data);
  const Tesseract = await import("tesseract.js");
  const { loadPdfDocument } = await import("@/lib/pdf-client");
  const pdf = await loadPdfDocument(data);
  let worker: Worker | undefined;
  let expired = false;
  let pageNumber = 0;
  const deadline = Date.now() + 180_000;
  const bounded = async <T,>(promise: Promise<T>, maximum = 45_000): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abort: (() => void) | undefined;
    try {
      return await Promise.race([promise, new Promise<never>((_, reject) => {
        abort = () => reject(new Error("OCR cancelled."));
        if (signal?.aborted) return abort();
        signal?.addEventListener("abort", abort, { once: true });
        timer = setTimeout(() => reject(new Error("OCR timed out. Try fewer pages or a clearer scan.")), Math.max(1, Math.min(maximum, deadline - Date.now())));
      })]);
    } finally { clearTimeout(timer); if (abort) signal?.removeEventListener("abort", abort); }
  };
  try {
    if (pdf.numPages > 10) throw new Error("OCR supports up to 10 pages per run. Split this PDF first.");
    onProgress?.("Loading OCR engine…", 0);
    const initialization = Tesseract.createWorker("eng", Tesseract.OEM.LSTM_ONLY, {
      workerPath: "/ocr/worker-entry.js", corePath: "/ocr", langPath: "/ocr",
      gzip: false, workerBlobURL: false,
      errorHandler: () => { /* Failed worker jobs reject; do not throw globally. */ },
      logger: (message) => {
        if (!expired && message.status === "recognizing text" && pageNumber > 0) {
          onProgress?.(`OCR page ${pageNumber} of ${pdf.numPages}…`, Math.round(((pageNumber - 1 + message.progress) / pdf.numPages) * 100));
        }
      },
    });
    // Dispose of a worker that completes initialization after the deadline.
    void initialization.then((created) => { if (expired) void created.terminate(); }, () => {});
    worker = await bounded(initialization, 60_000);
    const texts: string[] = [];
    for (pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      onProgress?.(`OCR page ${pageNumber} of ${pdf.numPages}…`);
      const page = await bounded(pdf.getPage(pageNumber));
      const canvas = document.createElement("canvas");
      try {
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(2.5, 3200 / Math.max(base.width, base.height), Math.sqrt(8_000_000 / (base.width * base.height)));
        const viewport = page.getViewport({ scale });
        canvas.width = Math.max(1, Math.floor(viewport.width)); canvas.height = Math.max(1, Math.floor(viewport.height));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not create OCR canvas.");
        const render = page.render({ canvasContext: context, viewport, canvas, background: "white" });
        try { await bounded(render.promise); } catch (error) { render.cancel(); throw error; }
        const image = await bounded(new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not render OCR page.")), "image/png")));
        const result = await bounded(worker.recognize(image, {}, { text: true }));
        const text = (result.data.text || "").trim(); texts.push(text);
        await onPage?.({ text, image, width: base.width, height: base.height, pageNumber });
      } finally { canvas.width = 0; canvas.height = 0; page.cleanup(); }
      onProgress?.(`OCR page ${pageNumber} of ${pdf.numPages}…`, Math.round(pageNumber / pdf.numPages * 100));
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    return texts;
  } finally {
    expired = true;
    if (worker) await worker.terminate().catch(() => {});
    await pdf.loadingTask.destroy().catch(() => {});
  }
}

export function pageTextsHaveContent(pages: string[]): boolean {
  return pages.some((page) => page.trim().length > 0);
}
