/* global libheif */
self.onmessage = async ({ data }) => {
  try {
    if (!(data.buffer instanceof ArrayBuffer) || data.buffer.byteLength > 20 * 1024 * 1024) throw new Error("HEIC exceeds the 20 MB limit.");
    importScripts("/codecs/heic/libheif-bundle.js");
    const codec = await libheif();
    const decoder = new codec.HeifDecoder();
    const images = decoder.decode(new Uint8Array(data.buffer));
    if (!images.length) throw new Error("Could not decode this HEIC image.");
    const image = images.find(entry => entry.is_primary()) || images[0];
    const width = image.get_width(), height = image.get_height();
    if (width < 1 || height < 1 || width > 8192 || height > 8192 || width * height > 16_000_000) throw new Error("HEIC output exceeds 16 megapixels or 8,192 pixels per side.");
    const pixels = new Uint8ClampedArray(width * height * 4);
    await new Promise((resolve, reject) => image.display({ data: pixels, width, height }, result => result ? resolve() : reject(new Error("Could not decode this HEIC image."))));
    for (const entry of images) entry.free();
    self.postMessage({ width, height, buffer: pixels.buffer }, [pixels.buffer]);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Could not decode this HEIC image." });
  }
};
