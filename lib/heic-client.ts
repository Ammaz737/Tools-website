"use client";
export async function decodeHeic(file: File, signal: AbortSignal): Promise<ImageData> {
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error("HEIC must be between 1 byte and 20 MB.");
  const buffer = await file.arrayBuffer();
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  const header = new TextDecoder("ascii").decode(buffer.slice(4, Math.min(80, buffer.byteLength)));
  if (!header.startsWith("ftyp") || !/(heic|heix|hevc|hevx|mif1|msf1)/.test(header)) throw new Error("Not a valid HEIC/HEIF image.");
  return new Promise((resolve, reject) => {
    const worker = new Worker("/codecs/heic/decode-worker.js");
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); worker.terminate(); };
    const abort = () => { cleanup(); reject(new DOMException("Cancelled", "AbortError")); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("HEIC decoding timed out. Try a smaller image.")); }, 30_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onerror = () => { cleanup(); reject(new Error("HEIC decoder could not load or process this image.")); };
    worker.onmessage = ({ data }) => {
      cleanup();
      if (data.error) { reject(new Error(data.error)); return; }
      if (!Number.isInteger(data.width) || !Number.isInteger(data.height) || data.width < 1 || data.height < 1 || data.width > 8192 || data.height > 8192 || data.width * data.height > 16_000_000 || !(data.buffer instanceof ArrayBuffer) || data.buffer.byteLength !== data.width * data.height * 4) {
        reject(new Error("HEIC decoder returned invalid dimensions.")); return;
      }
      resolve(new ImageData(new Uint8ClampedArray(data.buffer), data.width, data.height));
    };
    worker.postMessage({ buffer }, [buffer]);
  });
}
