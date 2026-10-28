"use client";

/**
 * Build object-URL thumbnails for the first N pages of a PDF.
 * Callers must revoke the returned URLs when done (or use revokePdfPreviewUrls).
 */
export async function buildPdfPreviewUrls(
  data: ArrayBuffer | Uint8Array | Blob,
  options?: {
    maxPages?: number;
    scale?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<{ urls: string[]; pageCount: number }> {
  const maxPages = options?.maxPages ?? 3;
  const scale = options?.scale ?? 1.25;

  const bytes =
    data instanceof Blob
      ? new Uint8Array(await data.arrayBuffer())
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);

  const copy = bytes.slice().buffer;
  const { renderFirstPdfPages } = await import("@/lib/pdf-client");
  const { pages, pageCount } = await renderFirstPdfPages(
    copy,
    maxPages,
    scale,
    options?.onProgress,
  );

  const urls = pages.map((page) =>
    URL.createObjectURL(new Blob([page.pngBytes as BlobPart], { type: "image/png" })),
  );

  return { urls, pageCount };
}

export function revokePdfPreviewUrls(urls: string[]) {
  urls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  });
}
