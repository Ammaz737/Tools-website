"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dropzone, ResultPanel, Button, Slider, Select, Input, Badge, Card, PdfPagePreview } from "@/components/ui";
import {
  buildPdfPreviewUrls,
  revokePdfPreviewUrls,
} from "@/lib/pdf-preview";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 16_000_000;
function imageIssue(image: HTMLImageElement, file: File, scale = 1) {
  if (file.size > MAX_IMAGE_BYTES) return "Image exceeds the 20 MB limit.";
  if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight * scale * scale > MAX_IMAGE_PIXELS || image.naturalWidth * scale > 8192 || image.naturalHeight * scale > 8192) return "Image output exceeds 16 megapixels or 8,192 pixels per side.";
  return "";
}
const ImageError = ({ message }: { message: string }) => message ? <p role="alert" className="text-sm text-[var(--danger)]">{message}</p> : null;

// Helper: Format file size
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// 1. Image Compressor
export const ImageCompressorTool: React.FC = () => {
  const [imageError, setImageError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState<number>(80);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  useEffect(() => () => { if (compressedUrl) URL.revokeObjectURL(compressedUrl); }, [compressedUrl]);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const file = files[0];

  useEffect(() => {
    if (!file) return;

    let isMounted = true;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const issue = imageIssue(img, file, 1);
      if (issue) { setImageError(issue); URL.revokeObjectURL(objectUrl); return; }
      setImageError("");
      if (!isMounted) return;
      setProcessing(true);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (isMounted && blob) {
              setCompressedUrl(URL.createObjectURL(blob));
              setCompressedSize(blob.size);
              setProcessing(false);
            }
          },
          "image/jpeg",
          quality / 100
        );
      }
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => { setImageError("Could not decode this image. Use a valid JPG, PNG, or WebP file."); };
    img.src = objectUrl;

    return () => {
      isMounted = false;
      img.onload = null;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, quality]);

  return (
    <div className="space-y-6">
      <ImageError message={imageError} />
      <Dropzone
        files={files}
        onFilesChange={(nextFiles) => { if (nextFiles.some((entry) => entry.size > MAX_IMAGE_BYTES)) { setFiles([]); setImageError("Image exceeds the 20 MB limit."); setProcessing(false); return; } setImageError(""); setFiles(nextFiles); setCompressedUrl(null); setCompressedSize(null); setProcessing(nextFiles.length > 0); }}
        accept="image/*"
        multiple={false}
        hint="Upload JPG, PNG, or WebP image"
      />

      {file && (
        <div className="space-y-6">
          <Slider
            label={`Compression Quality (${quality}%)`}
            min={10}
            max={100}
            value={quality}
            onChange={(value) => { setQuality(value); setProcessing(true); }}
            unit="%"
          />

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
              <span className="block text-xs text-[var(--ink-soft)] font-medium">Original Size</span>
              <span className="block font-mono text-lg font-bold text-[var(--ink)]">
                {formatSize(file.size)}
              </span>
            </div>
            <div className="p-3 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)]">
              <span className="block text-xs text-[var(--ink-soft)] font-medium">Compressed Size</span>
              <span className="block font-mono text-lg font-bold text-[var(--success)]">
                {compressedSize ? formatSize(compressedSize) : "..."}
              </span>
            </div>
          </div>

          <ResultPanel
            title="Compressed Image Preview"
            status={processing ? "processing" : "done"}
            downloadFileName={`compressed-${file.name.replace(/\.[^.]+$/, "")}.jpg`}
            downloadBlobUrl={imageError ? undefined : compressedUrl || undefined}
            onClear={() => setFiles([])}
          >
            {compressedUrl ? (
              <div className="flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={compressedUrl}
                  alt="Compressed preview"
                  className="max-h-80 rounded-[10px] object-contain shadow-xs border border-[var(--line)]"
                />
              </div>
            ) : (
              <p className="text-xs text-[var(--ink-faint)] text-center py-8">Processing image...</p>
            )}
          </ResultPanel>
        </div>
      )}
    </div>
  );
};

// 2. Image Resizer
export const ImageResizerTool: React.FC = () => {
  const resizeJob = useRef(0);
  useEffect(() => () => { resizeJob.current++; }, []);
  const [imageError, setImageError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  useEffect(() => () => { if (resizedUrl) URL.revokeObjectURL(resizedUrl); }, [resizedUrl]);

  const file = files[0];

  useEffect(() => {
    if (!file) return;
    let active = true;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      if (!active) return;
      const issue = imageIssue(img, file, 1);
      if (issue) { setImageError(issue); URL.revokeObjectURL(url); return; }
      setImageError("");
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setAspectRatio(img.naturalWidth / img.naturalHeight);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { setImageError("Could not decode this image. Use a valid JPG, PNG, or WebP file."); };
    img.src = url;
    return () => { active = false; img.onload = null; img.onerror = null; URL.revokeObjectURL(url); };
  }, [file]);

  const handleWidthChange = (w: number) => {
    resizeJob.current++; setResizedUrl(null);
    setWidth(w);
    if (lockAspect && aspectRatio) {
      setHeight(Math.round(w / aspectRatio));
    }
  };

  const handleHeightChange = (h: number) => {
    resizeJob.current++; setResizedUrl(null);
    setHeight(h);
    if (lockAspect && aspectRatio) {
      setWidth(Math.round(h * aspectRatio));
    }
  };

  const applyResize = () => {
    const job = ++resizeJob.current;
    if (!file) return;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 8192 || height > 8192 || width * height > MAX_IMAGE_PIXELS) { setImageError("Dimensions must be positive integers, at most 8,192 per side and 16 megapixels total."); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      if (job !== resizeJob.current) { URL.revokeObjectURL(url); return; }
      const issue = imageIssue(img, file, 1);
      if (issue) { setImageError(issue); URL.revokeObjectURL(url); return; }
      setImageError("");
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob && job === resizeJob.current) setResizedUrl(URL.createObjectURL(blob));
        }, file.type || "image/png");
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { setImageError("Could not decode this image. Use a valid JPG, PNG, or WebP file."); };
    img.src = url;
  };

  return (
    <div className="space-y-6">
      <ImageError message={imageError} />
      <Dropzone files={files} onFilesChange={(next) => { resizeJob.current++; setResizedUrl(null); if (next.some((entry) => entry.size > MAX_IMAGE_BYTES)) { setFiles([]); setImageError("Image exceeds the 20 MB limit."); return; } setFiles(next); setImageError(""); }} accept="image/*" multiple={false} />

      {file && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Width (px)"
              type="number"
              value={width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
            />
            <Input
              label="Height (px)"
              type="number"
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={lockAspect}
                onChange={(e) => setLockAspect(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              <span>Lock Aspect Ratio</span>
            </label>

            <div className="flex gap-2">
              {[0.25, 0.5, 0.75, 1.5].map((scale) => (
                <Button
                  key={scale}
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (aspectRatio) {
                      const newW = Math.round(width * scale);
                      handleWidthChange(newW);
                    }
                  }}
                >
                  {scale * 100}%
                </Button>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={applyResize}>
            Apply Resize
          </Button>

          {!imageError && resizedUrl && (
            <ResultPanel
              title="Resized Image Preview"
              status="done"
              downloadFileName={`resized-${width}x${height}-${file.name}`}
              downloadBlobUrl={imageError ? undefined : resizedUrl}
              onClear={() => setFiles([])}
            >
              <div className="flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resizedUrl}
                  alt="Resized preview"
                  className="max-h-80 rounded-[10px] object-contain shadow-xs border border-[var(--line)]"
                />
              </div>
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

// 3. Rotate Image
export const RotateImageTool: React.FC = () => {
  const [imageError, setImageError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotatedUrl, setRotatedUrl] = useState<string | null>(null);
  useEffect(() => () => { if (rotatedUrl) URL.revokeObjectURL(rotatedUrl); }, [rotatedUrl]);

  const file = files[0];

  useEffect(() => {
    if (!file) return;
    let active = true;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      if (!active) return;
      const issue = imageIssue(img, file, 1);
      if (issue) { setImageError(issue); URL.revokeObjectURL(url); return; }
      setImageError("");
      const canvas = document.createElement("canvas");
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));

      canvas.width = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
      canvas.height = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        canvas.toBlob((blob) => {
          if (active && blob) setRotatedUrl(URL.createObjectURL(blob));
        }, file.type || "image/png");
      }
      URL.revokeObjectURL(url);
    };

    img.onerror = () => { setImageError("Could not decode this image. Use a valid JPG, PNG, or WebP file."); };
    img.src = url;
    return () => { active = false; img.onload = null; img.onerror = null; URL.revokeObjectURL(url); };
  }, [file, rotation, flipH, flipV]);

  return (
    <div className="space-y-6">
      <ImageError message={imageError} />
      <Dropzone files={files} onFilesChange={(next) => { setRotatedUrl(null); if (next.some((entry) => entry.size > MAX_IMAGE_BYTES)) { setFiles([]); setImageError("Image exceeds the 20 MB limit."); return; } setFiles(next); setImageError(""); }} accept="image/*" multiple={false} />

      {file && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => setRotation((r) => (r + 90) % 360)}>
              Rotate 90°
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setRotation((r) => (r + 180) % 360)}>
              Rotate 180°
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setFlipH((f) => !f)}>
              Flip Horizontal {flipH && "✓"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setFlipV((f) => !f)}>
              Flip Vertical {flipV && "✓"}
            </Button>
          </div>

          <ResultPanel
            title="Transformed Image"
            status="done"
            downloadFileName={`rotated-${file.name}`}
            downloadBlobUrl={imageError ? undefined : rotatedUrl || undefined}
            onClear={() => setFiles([])}
          >
            {!imageError && rotatedUrl && (
              <div className="flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rotatedUrl}
                  alt="Rotated preview"
                  className="max-h-80 rounded-[10px] object-contain shadow-xs border border-[var(--line)]"
                />
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </div>
  );
};

// 4. Format Converters (convert-image, jpg-to-png, png-to-jpg, webp-converter, etc.)
export const ImageConverterTool: React.FC<{ targetFormat?: string }> = ({
  targetFormat = "png",
}) => {
  const [imageError, setImageError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<string>(targetFormat);
  const [processing, setProcessing] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  useEffect(() => () => { if (convertedUrl) URL.revokeObjectURL(convertedUrl); }, [convertedUrl]);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [error, setError] = useState<string | null>(null);

  const file = files[0];
  const looksHeic =
    !!file &&
    (/\.(heic|heif)$/i.test(file.name) ||
      file.type === "image/heic" ||
      file.type === "image/heif");

  useEffect(() => {
    if (!file) return;
    let active = true;
    const controller = new AbortController();
    const img = new Image();
    let url = "";
    const fail = (message: string) => { if (active) { setConvertedUrl(null); setError(message); setProcessing(false); } };
    const encode = () => {
      if (!active) return;
      const issue = imageIssue(img, file, 1);
      if (issue) { fail(issue); return; }
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) { fail("Canvas is unavailable in this browser."); return; }
      if (format === "jpeg" || format === "jpg") { context.fillStyle = bgColor; context.fillRect(0, 0, canvas.width, canvas.height); }
      context.drawImage(img, 0, 0);
      const mime = `image/${format === "jpg" ? "jpeg" : format}`;
      canvas.toBlob(blob => {
        canvas.width = 0; canvas.height = 0;
        if (!active) return;
        if (!blob || blob.type !== mime) { fail("This browser cannot export the selected format."); return; }
        setConvertedUrl(URL.createObjectURL(blob)); setProcessing(false);
      }, mime, 0.92);
      URL.revokeObjectURL(url);
    };
    img.onload = encode;
    img.onerror = () => { URL.revokeObjectURL(url); fail("Could not load this image in the browser."); };
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setConvertedUrl(null); setError(null); setProcessing(true); setImageError("");
      try {
        if (looksHeic) {
          const { decodeHeic } = await import("@/lib/heic-client");
          const pixels = await decodeHeic(file, controller.signal);
          if (!active) return;
          const canvas = document.createElement("canvas");
          canvas.width = pixels.width; canvas.height = pixels.height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas is unavailable in this browser.");
          context.putImageData(pixels, 0, 0);
          const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not export decoded HEIC.")), "image/png"));
          canvas.width = 0; canvas.height = 0;
          if (!active) return;
          url = URL.createObjectURL(png);
        } else { url = URL.createObjectURL(file); }
        img.src = url;
      } catch (error) { if (active) fail(error instanceof Error ? error.message : "Image conversion failed."); }
    })();
    return () => { active = false; controller.abort(); img.onload = null; img.onerror = null; if (url) URL.revokeObjectURL(url); };
  }, [file, format, bgColor, looksHeic]);

  return (
    <div className="space-y-6">
      <ImageError message={imageError} />
      {looksHeic && (
        <Card variant="bordered" className="border-[var(--warn)] px-4 py-3 text-xs text-[var(--ink-soft)]">
          Converts the primary HEIC/HEIF photo locally. Auxiliary images, animation and original metadata are not exported.
        </Card>
      )}
      <Dropzone files={files} onFilesChange={(next) => { setConvertedUrl(null); setError(null); if (next.some((entry) => entry.size > MAX_IMAGE_BYTES)) { setFiles([]); setImageError("Image exceeds the 20 MB limit."); return; } setFiles(next); setImageError(""); }} accept="image/*,.heic,.heif" multiple={false} />

      {processing && <p role="status">Converting image…</p>}
      {error && (
        <p role="alert" className="text-xs text-[var(--danger)]">{error}</p>
      )}

      {file && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Target Format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              options={[
                { value: "png", label: "PNG (.png)" },
                { value: "jpeg", label: "JPG / JPEG (.jpg)" },
                { value: "webp", label: "WebP (.webp)" },
              ]}
            />

            {(format === "jpeg" || format === "jpg") && (
              <Input
                label="Background Fill Color (For Transparent Regions)"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            )}
          </div>

          <ResultPanel
            title={`Converted Image (${format.toUpperCase()})`}
            status="done"
            downloadFileName={`${file.name.split(".")[0]}.${format}`}
            downloadBlobUrl={imageError || processing || error ? undefined : convertedUrl || undefined}
            onClear={() => setFiles([])}
          >
            {!imageError && convertedUrl && (
              <div className="flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={convertedUrl}
                  alt="Converted preview"
                  className="max-h-80 rounded-[10px] object-contain shadow-xs border border-[var(--line)]"
                />
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </div>
  );
};

// 5. SVG Converter
export const SvgConverterTool: React.FC = () => {
  const [svgText, setSvgText] = useState(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#E4572E"/></svg>'
  );
  const [svgError, setSvgError] = useState("");
  const [scale, setScale] = useState<number>(2);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  useEffect(() => () => { if (pngUrl) URL.revokeObjectURL(pngUrl); }, [pngUrl]);

  useEffect(() => {
    if (!svgText.trim() || svgError) return;
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    let active = true;
    const img = new Image();

    img.onload = () => {
      if (!active) return;
      if (img.naturalWidth * img.naturalHeight * scale * scale > MAX_IMAGE_PIXELS || img.naturalWidth * scale > 8192 || img.naturalHeight * scale > 8192) { setSvgError("SVG output exceeds 16 megapixels or 8,192 pixels per side."); return; }
      const canvas = document.createElement("canvas");
      canvas.width = (img.naturalWidth || 300) * scale;
      canvas.height = (img.naturalHeight || 300) * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => {
          if (active && b) setPngUrl(URL.createObjectURL(b));
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };

    img.onerror = () => { if (active) { setPngUrl(null); setSvgError("Could not decode this SVG."); } };
    img.src = url;
    return () => { active = false; img.onload = null; img.onerror = null; URL.revokeObjectURL(url); };
  }, [svgText, scale, svgError]);

  return (
    <div className="space-y-6">
      <Input label="SVG Markup Code" value={svgText} onChange={(e) => {
        const text = e.target.value; setSvgText(text); setPngUrl(null);
        const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
        const unsafe = parsed.querySelector("parsererror, script, foreignObject") || Array.from(parsed.querySelectorAll("*")).some((node) => Array.from(node.attributes).some((attribute) => /^on/i.test(attribute.name) || ((attribute.localName === "href" || attribute.name === "src") && !attribute.value.startsWith("#")) || /url\(/i.test(attribute.value)));
        setSvgError(text.length > 1000000 ? "SVG markup exceeds 1 MB of characters." : text.trim() && (unsafe || parsed.documentElement.localName !== "svg") ? "Enter a valid self-contained SVG without scripts or external resources." : "");
      }} />
      <ImageError message={svgError} />

      <Select
        label="Export Scale Factor"
        value={scale.toString()}
        onChange={(e) => { setScale(Number(e.target.value)); setPngUrl(null); }}
        options={[
          { value: "1", label: "1x Resolution" },
          { value: "2", label: "2x High DPI" },
          { value: "4", label: "4x Ultra HD" },
        ]}
      />

      <ResultPanel
        title="Exported Raster PNG"
        status="done"
        downloadFileName="vector-export.png"
        downloadBlobUrl={svgError ? undefined : pngUrl || undefined}
        onClear={() => { setSvgText(""); setPngUrl(null); setSvgError(""); }}
      >
        {pngUrl && (
          <div className="flex justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pngUrl} alt="Exported PNG" className="max-h-60 rounded-[10px] border border-[var(--line)]" />
          </div>
        )}
      </ResultPanel>
    </div>
  );
};

// 6. Image to PDF
export const ImageToPdfTool: React.FC<{
  acceptMode?: "jpg" | "png" | "both";
}> = ({ acceptMode = "both" }) => {
  const generation = useRef(0);
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4" | "letter">("fit");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewPageCount, setPreviewPageCount] = useState(0);
  const previewUrlsRef = useRef<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearPreview = () => {
    revokePdfPreviewUrls(previewUrlsRef.current);
    previewUrlsRef.current = [];
    setPreviewUrls([]);
    setPreviewPageCount(0);
  };

  useEffect(
    () => () => {
      generation.current++;
      revokePdfPreviewUrls(previewUrlsRef.current);
    },
    [],
  );

  const accept =
    acceptMode === "jpg"
      ? "image/jpeg,.jpg,.jpeg"
      : acceptMode === "png"
        ? "image/png,.png"
        : "image/png,image/jpeg,.png,.jpg,.jpeg";

  const hint =
    acceptMode === "jpg"
      ? "Upload one or more JPG images. Reorder with the arrows before converting."
      : acceptMode === "png"
        ? "Upload one or more PNG images. Reorder with the arrows before converting."
        : "Upload JPG or PNG images to combine into one PDF.";

  const reset = () => {
    generation.current++;
    setFiles([]);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    clearPreview();
    setError(null);
  };

  const generatePdf = async () => {
    const job = ++generation.current;
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    clearPreview();

    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();

      const pageDims = {
        a4: { w: 595.28, h: 841.89 },
        letter: { w: 612, h: 792 },
      } as const;

      if (files.length > 30 || files.reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024) throw new Error("Use at most 30 images and 50 MB total.");
      for (const file of files) {
        if (file.size > MAX_IMAGE_BYTES) throw new Error("Each image must be at most 20 MB.");
        const buffer = await file.arrayBuffer();
        const isJpg =
          /jpe?g$/i.test(file.name) ||
          file.type === "image/jpeg" ||
          file.type === "image/jpg";

        let image;
        try {
          image = isJpg
            ? await pdfDoc.embedJpg(buffer)
            : await pdfDoc.embedPng(buffer);
        } catch {
          throw new Error(
            `Could not embed "${file.name}". Use standard JPG or PNG files.`,
          );
        }

        if (image.width * image.height > MAX_IMAGE_PIXELS || image.width > 8192 || image.height > 8192) throw new Error("Image exceeds 16 megapixels or 8,192 pixels per side.");
        if (pageSize === "fit") {
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        } else {
          const { w, h } = pageDims[pageSize];
          const page = pdfDoc.addPage([w, h]);
          const margin = 36;
          const maxW = w - margin * 2;
          const maxH = h - margin * 2;
          const scale = Math.min(maxW / image.width, maxH / image.height);
          const drawW = image.width * scale;
          const drawH = image.height * scale;
          page.drawImage(image, {
            x: (w - drawW) / 2,
            y: (h - drawH) / 2,
            width: drawW,
            height: drawH,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      if (job !== generation.current) return;
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      setPdfUrl(URL.createObjectURL(blob));
      try {
        const preview = await buildPdfPreviewUrls(blob, { maxPages: 3, scale: 1.25 });
        if (job !== generation.current) { revokePdfPreviewUrls(preview.urls); return; }
        previewUrlsRef.current = preview.urls;
        setPreviewUrls(preview.urls);
        setPreviewPageCount(preview.pageCount);
      } catch {
        // Preview is optional
      }
    } catch (err) {
      if (job === generation.current) setError(err instanceof Error ? err.message : "Could not create PDF");
    } finally {
      if (job === generation.current) setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Dropzone
        files={files}
        onFilesChange={(next) => {
          generation.current++; setProcessing(false);
          setFiles(next);
          if (pdfUrl) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          clearPreview();
          setError(null);
        }}
        accept={accept}
        multiple
        hint={hint}
      />

      {files.length > 0 && (
        <div className="space-y-4">
          <Select
            label="Page size"
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as typeof pageSize)}
            options={[
              { value: "fit", label: "Fit to image size" },
              { value: "a4", label: "A4 (image centered)" },
              { value: "letter", label: "US Letter (image centered)" },
            ]}
          />
          <Button variant="primary" onClick={generatePdf} loading={processing}>
            Generate PDF ({files.length} page{files.length === 1 ? "" : "s"})
          </Button>
          {error && (
            <p className="text-xs text-[var(--danger)]">{error}</p>
          )}
          {pdfUrl && (
            <ResultPanel
              title="Combined PDF"
              status="done"
              downloadFileName="images-combined.pdf"
              downloadBlobUrl={pdfUrl}
              onClear={reset}
            >
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <Badge variant="success" size="md">
                  PDF ready for download
                </Badge>
                {previewUrls.length > 0 ? (
                  <PdfPagePreview urls={previewUrls} pageCount={previewPageCount} />
                ) : null}
              </div>
            </ResultPanel>
          )}
        </div>
      )}
    </div>
  );
};

// 7. Crop Image Tool
export const CropImageTool: React.FC = () => {
  const sourceSize = useRef<{ file: File; width: number; height: number } | null>(null);
  const [imageError, setImageError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [aspect, setAspect] = useState<string>("free");
  const [cropX, setCropX] = useState<number>(10);
  const [cropY, setCropY] = useState<number>(10);
  const [cropW, setCropW] = useState<number>(80);
  const [cropH, setCropH] = useState<number>(80);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  useEffect(() => () => { if (croppedUrl) URL.revokeObjectURL(croppedUrl); }, [croppedUrl]);

  const file = files[0];

  useEffect(() => {
    if (!file) return;
    let active = true;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const issue = imageIssue(img, file, 1);
      if (issue) { setImageError(issue); URL.revokeObjectURL(url); return; }
      setImageError("");
      if (!active) return;
      sourceSize.current = { file, width: img.naturalWidth, height: img.naturalHeight };
      const realX = (cropX / 100) * img.naturalWidth;
      const realY = (cropY / 100) * img.naturalHeight;
      const realW = Math.min((cropW / 100) * img.naturalWidth, img.naturalWidth - realX);
      const realH = Math.min((cropH / 100) * img.naturalHeight, img.naturalHeight - realY);

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, realW);
      canvas.height = Math.max(1, realH);
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, realX, realY, realW, realH, 0, 0, realW, realH);
        canvas.toBlob((blob) => {
          if (active && blob) setCroppedUrl(URL.createObjectURL(blob));
        }, file.type || "image/png");
      }
      URL.revokeObjectURL(url);
    };

    img.onerror = () => { setImageError("Could not decode this image. Use a valid JPG, PNG, or WebP file."); };
    img.src = url;
    return () => { active = false; img.onload = null; img.onerror = null; URL.revokeObjectURL(url); };
  }, [file, cropX, cropY, cropW, cropH]);

  const handlePreset = (preset: string) => {
    setAspect(preset);
    if (preset === "free") return;
    const size = sourceSize.current;
    if (!size || size.file !== file) return;
    const [numerator, denominator] = preset.split(":").map(Number);
    const ratio = numerator / denominator;
    // Fit the requested pixel ratio within the remaining source bounds.
    const availableWidth = size.width * (100 - cropX) / 100;
    const availableHeight = size.height * (100 - cropY) / 100;
    const width = Math.min(availableWidth, availableHeight * ratio);
    const height = width / ratio;
    setCropW(width / size.width * 100);
    setCropH(height / size.height * 100);
  };

  return (
    <div className="space-y-6">
      <ImageError message={imageError} />
      <Dropzone files={files} onFilesChange={(next) => { setCroppedUrl(null); if (next.some((entry) => entry.size > MAX_IMAGE_BYTES)) { setFiles([]); setImageError("Image exceeds the 20 MB limit."); return; } setFiles(next); setImageError(""); }} accept="image/*" multiple={false} />

      {file && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold self-center mr-2">Presets:</span>
            {["free", "1:1", "16:9", "4:3", "3:2"].map((p) => (
              <Button
                key={p}
                variant={aspect === p ? "primary" : "secondary"}
                size="sm"
                onClick={() => handlePreset(p)}
              >
                {p.toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Slider label="Crop X Position (%)" min={0} max={90} value={cropX} onChange={setCropX} unit="%" />
            <Slider label="Crop Y Position (%)" min={0} max={90} value={cropY} onChange={setCropY} unit="%" />
            <Slider label="Crop Width (%)" min={10} max={100 - cropX} value={cropW} onChange={setCropW} unit="%" />
            <Slider label="Crop Height (%)" min={10} max={100 - cropY} value={cropH} onChange={setCropH} unit="%" />
          </div>

          <ResultPanel
            title="Cropped Image Result"
            status="done"
            downloadFileName={`cropped-${file.name}`}
            downloadBlobUrl={imageError ? undefined : croppedUrl || undefined}
            onClear={() => setFiles([])}
          >
            {!imageError && croppedUrl && (
              <div className="flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={croppedUrl}
                  alt="Cropped Preview"
                  className="max-h-80 rounded-[10px] object-contain shadow-xs border border-[var(--line)]"
                />
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </div>
  );
};

// 8. Background Remover Tool
export const BackgroundRemoverTool: React.FC = () => {
  const [imageError, setImageError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [targetColor, setTargetColor] = useState("#FFFFFF");
  const [tolerance, setTolerance] = useState<number>(30);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  useEffect(() => () => { if (outputUrl) URL.revokeObjectURL(outputUrl); }, [outputUrl]);
  const [processing, setProcessing] = useState(false);

  const file = files[0];

  useEffect(() => {
    if (!file) return;
    let active = true;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const issue = imageIssue(img, file, 1);
      if (issue) { setImageError(issue); URL.revokeObjectURL(url); return; }
      setImageError("");
      if (!active) return;
      setProcessing(true);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Convert hex targetColor to R, G, B
        const rTarget = parseInt(targetColor.slice(1, 3), 16);
        const gTarget = parseInt(targetColor.slice(3, 5), 16);
        const bTarget = parseInt(targetColor.slice(5, 7), 16);

        const maxDist = (tolerance / 100) * 441.67; // sqrt(255^2 * 3)

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const dist = Math.sqrt(
            (r - rTarget) ** 2 + (g - gTarget) ** 2 + (b - bTarget) ** 2
          );

          if (dist <= maxDist) {
            data[i + 3] = 0; // Transparent
          }
        }

        ctx.putImageData(imgData, 0, 0);
        canvas.toBlob((blob) => {
          if (active && blob) setOutputUrl(URL.createObjectURL(blob));
          if (active) setProcessing(false);
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };

    img.onerror = () => { setImageError("Could not decode this image. Use a valid JPG, PNG, or WebP file."); };
    img.src = url;
    return () => { active = false; img.onload = null; img.onerror = null; URL.revokeObjectURL(url); };
  }, [file, targetColor, tolerance]);

  return (
    <div className="space-y-6">
      <ImageError message={imageError} />
      <Card variant="sunk" className="px-4 py-3 text-xs leading-relaxed text-[var(--ink-soft)]">
        Removes pixels close to a chosen background color (chroma key). Works best on{" "}
        <strong>solid-color</strong> backgrounds — not AI subject segmentation.
      </Card>
      <Dropzone files={files} onFilesChange={(next) => { setOutputUrl(null); if (next.some((entry) => entry.size > MAX_IMAGE_BYTES)) { setFiles([]); setImageError("Image exceeds the 20 MB limit."); return; } setFiles(next); setImageError(""); }} accept="image/*" multiple={false} />

      {file && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Background Color to Remove"
              type="color"
              value={targetColor}
              onChange={(e) => setTargetColor(e.target.value)}
            />
            <Slider
              label="Removal Tolerance"
              min={5}
              max={80}
              value={tolerance}
              onChange={setTolerance}
              unit="%"
            />
          </div>

          <ResultPanel
            title="Transparent Image Output (PNG)"
            status={processing ? "processing" : "done"}
            downloadFileName={`transparent-${file.name.split(".")[0]}.png`}
            downloadBlobUrl={imageError ? undefined : outputUrl || undefined}
            onClear={() => setFiles([])}
          >
            {!imageError && outputUrl && (
              <div className="flex justify-center rounded-[10px] border border-[var(--line)] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] p-4 [background-size:16px_16px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={outputUrl}
                  alt="Transparent result"
                  className="max-h-80 object-contain"
                />
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </div>
  );
};

// 9. Image Upscaler Tool
export const ImageUpscalerTool: React.FC = () => {
  const [imageError, setImageError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [scaleFactor, setScaleFactor] = useState<number>(2);
  const [sharpen, setSharpen] = useState<boolean>(true);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  useEffect(() => () => { if (upscaledUrl) URL.revokeObjectURL(upscaledUrl); }, [upscaledUrl]);
  const [processing, setProcessing] = useState(false);

  const file = files[0];

  useEffect(() => {
    if (!file) return;
    let active = true;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const issue = imageIssue(img, file, scaleFactor);
      if (issue) { setImageError(issue); URL.revokeObjectURL(url); return; }
      setImageError("");
      if (!active) return;
      setProcessing(true);
      const targetW = img.naturalWidth * scaleFactor;
      const targetH = img.naturalHeight * scaleFactor;

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetW, targetH);

        if (sharpen) {
          const imgData = ctx.getImageData(0, 0, targetW, targetH);
          const d = imgData.data;
          const w = targetW;
          const h = targetH;

          // Simple 3x3 Sharpen Kernel pass
          const kernel = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0];
          const copy = new Uint8ClampedArray(d);

          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4;
              for (let c = 0; c < 3; c++) {
                const val =
                  copy[((y - 1) * w + (x - 1)) * 4 + c] * kernel[0] +
                  copy[((y - 1) * w + x) * 4 + c] * kernel[1] +
                  copy[((y - 1) * w + (x + 1)) * 4 + c] * kernel[2] +
                  copy[(y * w + (x - 1)) * 4 + c] * kernel[3] +
                  copy[(y * w + x) * 4 + c] * kernel[4] +
                  copy[(y * w + (x + 1)) * 4 + c] * kernel[5] +
                  copy[((y + 1) * w + (x - 1)) * 4 + c] * kernel[6] +
                  copy[((y + 1) * w + x) * 4 + c] * kernel[7] +
                  copy[((y + 1) * w + (x + 1)) * 4 + c] * kernel[8];
                d[idx + c] = Math.min(255, Math.max(0, val));
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        canvas.toBlob((blob) => {
          if (active && blob) setUpscaledUrl(URL.createObjectURL(blob));
          if (active) setProcessing(false);
        }, file.type || "image/png");
      }
      URL.revokeObjectURL(url);
    };

    img.onerror = () => { setImageError("Could not decode this image. Use a valid JPG, PNG, or WebP file."); };
    img.src = url;
    return () => { active = false; img.onload = null; img.onerror = null; URL.revokeObjectURL(url); };
  }, [file, scaleFactor, sharpen]);

  return (
    <div className="space-y-6">
      <ImageError message={imageError} />
      <Card variant="sunk" className="px-4 py-3 text-xs leading-relaxed text-[var(--ink-soft)]">
        This is <strong>resize + optional sharpen</strong> (browser canvas), not an AI/ML upscaler.
        Fine detail cannot be invented.
      </Card>
      <Dropzone files={files} onFilesChange={(next) => { setUpscaledUrl(null); if (next.some((entry) => entry.size > MAX_IMAGE_BYTES)) { setFiles([]); setImageError("Image exceeds the 20 MB limit."); return; } setFiles(next); setImageError(""); }} accept="image/*" multiple={false} />

      {file && (
        <div className="space-y-6">
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <Select
              label="Scale Factor"
              value={scaleFactor.toString()}
              onChange={(e) => setScaleFactor(Number(e.target.value))}
              options={[
                { value: "2", label: "2× scale" },
                { value: "4", label: "4× scale" },
                { value: "8", label: "8× scale (heavy)" },
              ]}
            />
            <label className="flex cursor-pointer items-center gap-2 pt-6 text-xs font-medium">
              <input
                type="checkbox"
                checked={sharpen}
                onChange={(e) => setSharpen(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              <span>Apply sharpening pass</span>
            </label>
          </div>

          <ResultPanel
            title={`Upscaled Image (${scaleFactor}x Resolution)`}
            status={processing ? "processing" : "done"}
            downloadFileName={`upscaled-${scaleFactor}x-${file.name}`}
            downloadBlobUrl={imageError ? undefined : upscaledUrl || undefined}
            onClear={() => setFiles([])}
          >
            {!imageError && upscaledUrl && (
              <div className="flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={upscaledUrl}
                  alt="Upscaled result"
                  className="max-h-80 rounded-[10px] object-contain shadow-xs border border-[var(--line)]"
                />
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </div>
  );
};

// 10. Screenshot & Image Annotator Tool
export const ScreenshotTool: React.FC = () => {
  const [imageError, setImageError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [color, setColor] = useState("#E4572E");
  const [text, setText] = useState("");
  const [annotatedUrl, setAnnotatedUrl] = useState<string | null>(null);
  useEffect(() => () => { if (annotatedUrl) URL.revokeObjectURL(annotatedUrl); }, [annotatedUrl]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const file = files[0];

  useEffect(() => {
    if (!file) return;
    let active = true;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      if (!active) return;
      const issue = imageIssue(img, file, 1);
      if (issue) { setImageError(issue); URL.revokeObjectURL(url); return; }
      setImageError("");
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0);

        if (text.trim()) {
          // Draw text annotation badge
          ctx.fillStyle = color;
          ctx.font = "bold 32px sans-serif";
          ctx.fillText(text, 40, 80);

          // Draw callout box
          ctx.strokeStyle = color;
          ctx.lineWidth = 6;
          ctx.strokeRect(30, 30, ctx.measureText(text).width + 20, 70);
        }

        canvas.toBlob((blob) => {
          if (active && blob) setAnnotatedUrl(URL.createObjectURL(blob));
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };

    img.onerror = () => { setImageError("Could not decode this image. Use a valid JPG, PNG, or WebP file."); };
    img.src = url;
    return () => { active = false; img.onload = null; img.onerror = null; URL.revokeObjectURL(url); };
  }, [file, color, text]);

  return (
    <div className="space-y-6">
      <ImageError message={imageError} />
      <p className="text-sm text-[var(--ink-soft)]">Annotate an uploaded screenshot or image. This tool does not capture your screen.</p>
      <Dropzone files={files} onFilesChange={(next) => { setAnnotatedUrl(null); if (next.some((entry) => entry.size > MAX_IMAGE_BYTES)) { setFiles([]); setImageError("Image exceeds the 20 MB limit."); return; } setFiles(next); setImageError(""); }} accept="image/*" multiple={false} />

      {file && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Annotation Banner Text"
              placeholder="e.g. REVIEW THIS AREA"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Input
              label="Annotation Accent Color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <ResultPanel
            title="Annotated Image Preview"
            status="done"
            downloadFileName={`annotated-${file.name.replace(/\.[^.]+$/, "")}.png`}
            downloadBlobUrl={imageError ? undefined : annotatedUrl || undefined}
            onClear={() => setFiles([])}
          >
            {!imageError && annotatedUrl && (
              <div className="flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={annotatedUrl}
                  alt="Annotated preview"
                  className="max-h-80 rounded-[10px] object-contain shadow-xs border border-[var(--line)]"
                />
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </div>
  );
};

