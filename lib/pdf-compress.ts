"use client";

import { PDFDocument, PDFName, PDFNumber, PDFRawStream } from "pdf-lib";
import {
  pdfRenderScale,
  validatePdfBytes,
  PDF_COMPRESS_LIMIT_MB,
} from "./pdf-ops";

export type CompressionLevel = "high" | "medium" | "low";
export type CompressionMode = "preserve" | "flatten";
export interface CompressionResult {
  bytes: Uint8Array;
  method: "image" | "lossless" | "original";
  optimizedImages: number;
}

const settings = {
  high: { scale: 1.5, quality: 0.82, edge: 3200 },
  medium: { scale: 1.15, quality: 0.68, edge: 2400 },
  low: { scale: 0.9, quality: 0.52, edge: 1600 },
};
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function encodeJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(new Error("Could not encode this image.")),
      "image/jpeg",
      quality,
    ),
  );
  return new Uint8Array(await blob.arrayBuffer());
}

/** Recompress eligible embedded JPEGs in place; retain page boxes, text and links.
 * Masked, non-JPEG and color-managed images stay untouched to preserve content. */
export async function compressPdfDocument(
  data: ArrayBuffer,
  level: CompressionLevel,
  mode: CompressionMode = "preserve",
  onProgress?: (value: number) => void,
): Promise<CompressionResult> {
  await validatePdfBytes(data, { maxSizeMB: PDF_COMPRESS_LIMIT_MB });
  const options = settings[level];
  const original = new Uint8Array(data);
  const document = await PDFDocument.load(data, { updateMetadata: false });
  let optimizedImages = 0;
  let result: Uint8Array;

  if (mode === "flatten") {
    const { loadPdfDocument, renderLoadedPageToBlob } =
      await import("./pdf-client");
    const pdf = await loadPdfDocument(data);
    try {
      const output = await PDFDocument.create();
      for (let index = 1; index <= pdf.numPages; index++) {
        const page = await pdf.getPage(index);
        try {
          const size = page.getViewport({ scale: 1 });
          const blob = await renderLoadedPageToBlob(
            page,
            "jpg",
            options.scale,
            { maxEdgePx: options.edge, jpegQuality: options.quality },
          );
          const image = await output.embedJpg(await blob.arrayBuffer());
          // Image pixels are independent of physical PDF points.
          const sheet = output.addPage([size.width, size.height]);
          sheet.drawImage(image, {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
          });
        } finally {
          page.cleanup();
        }
        onProgress?.(Math.round((index / pdf.numPages) * 95));
        await pause();
      }
      result = await output.save({ useObjectStreams: true });
      optimizedImages = pdf.numPages;
    } finally {
      await pdf.loadingTask.destroy();
    }
  } else {
    const images = document.context
      .enumerateIndirectObjects()
      .filter(
        ([, value]) =>
          value instanceof PDFRawStream &&
          value.dict.get(PDFName.of("Subtype")) === PDFName.of("Image"),
      );
    for (const [index, [reference, object]] of images.entries()) {
      const stream = object as PDFRawStream;
      const dict = stream.dict;
      const color = dict.get(PDFName.of("ColorSpace"));
      if (
        dict.get(PDFName.of("Filter")) === PDFName.of("DCTDecode") &&
        !dict.has(PDFName.of("SMask")) &&
        !dict.has(PDFName.of("Mask")) &&
        !dict.has(PDFName.of("Decode")) &&
        (color === PDFName.of("DeviceRGB") ||
          color === PDFName.of("DeviceGray"))
      ) {
        const width =
          dict.lookupMaybe(PDFName.of("Width"), PDFNumber)?.asNumber() ?? 0;
        const height =
          dict.lookupMaybe(PDFName.of("Height"), PDFNumber)?.asNumber() ?? 0;
        if (width > 0 && height > 0 && stream.contents.byteLength > 4096) {
          const scale = pdfRenderScale(width, height, 1, options.edge);
          const canvas = globalThis.document.createElement("canvas");
          let bitmap: ImageBitmap | undefined;
          try {
            canvas.width = Math.max(1, Math.floor(width * scale));
            canvas.height = Math.max(1, Math.floor(height * scale));
            bitmap = await createImageBitmap(
              new Blob([stream.contents as BlobPart], { type: "image/jpeg" }),
              {
                resizeWidth: canvas.width,
                resizeHeight: canvas.height,
                resizeQuality: "high",
                imageOrientation: "none",
              },
            );
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Could not create an image canvas.");
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const encoded = await encodeJpeg(canvas, options.quality);
            if (encoded.length < stream.contents.length) {
              const embedded = await document.embedJpg(encoded);
              await embedded.embed();
              const replacement = document.context.lookup(embedded.ref);
              if (!(replacement instanceof PDFRawStream))
                throw new Error("Could not rebuild the PDF image.");
              document.context.assign(reference, replacement);
              document.context.delete(embedded.ref);
              optimizedImages++;
            }
          } catch {
            // An unsupported image stays byte-for-byte intact in the PDF.
          } finally {
            bitmap?.close();
            canvas.width = 0;
            canvas.height = 0;
          }
        }
      }
      onProgress?.(Math.round(((index + 1) / Math.max(1, images.length)) * 95));
      await pause();
    }
    result = await document.save({ useObjectStreams: true });
  }

  let method: CompressionResult["method"] = optimizedImages
    ? "image"
    : "lossless";
  if (result.byteLength >= original.byteLength) {
    // Keep selectable content if flattening made an efficient PDF larger.
    const lossless =
      mode === "flatten"
        ? await document.save({ useObjectStreams: true })
        : result;
    if (lossless.byteLength < original.byteLength) {
      result = lossless;
      method = "lossless";
      optimizedImages = 0;
    } else {
      result = original;
      method = "original";
      optimizedImages = 0;
    }
  }
  onProgress?.(100);
  return { bytes: result, method, optimizedImages };
}
