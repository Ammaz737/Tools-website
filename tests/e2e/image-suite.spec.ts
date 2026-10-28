import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
async function fixture(page: Page, mime = "image/png") {
  const encoded = await page.evaluate((type) => { const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 200; const ctx = canvas.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, 320, 200); ctx.fillStyle = "black"; ctx.fillRect(0, 0, 160, 200); return canvas.toDataURL(type).split(",")[1]; }, mime);
  return Buffer.from(encoded, "base64");
}
async function upload(page: Page, mime = "image/png", name = "fixture.png") { await page.locator('input[type="file"]').setInputFiles({ name, mimeType: mime, buffer: await fixture(page, mime) }); }
async function downloaded(page: Page) { const ready = page.waitForEvent("download"); await page.getByRole("button", { name: "Download", exact: true }).click(); const download = await ready; return { bytes: await readFile((await download.path())!), name: download.suggestedFilename() }; }
async function inspect(page: Page, bytes: Buffer) { return page.evaluate(async (base64) => { const bytes = Uint8Array.from(atob(base64), (value) => value.charCodeAt(0)); const image = await createImageBitmap(new Blob([bytes])); const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height; const ctx = canvas.getContext("2d")!; ctx.drawImage(image, 0, 0); const info = { width: image.width, height: image.height, black: Array.from(ctx.getImageData(50, 100, 1, 1).data), white: Array.from(ctx.getImageData(Math.min(200, image.width - 1), Math.min(100, image.height - 1), 1, 1).data) }; image.close(); return info; }, bytes.toString("base64")); }
const converters = [
  ["convert-image", "image/png", "png", "png"], ["jpg-to-png", "image/jpeg", "jpg", "png"], ["jfif-to-png", "image/jpeg", "jfif", "png"], ["webp-to-png", "image/webp", "webp", "png"],
  ["png-to-jpg", "image/png", "png", "jpg"], ["webp-to-jpg", "image/webp", "webp", "jpg"], ["jpeg-to-jpg", "image/jpeg", "jpeg", "jpg"], ["webp-converter", "image/png", "png", "webp"],
] as const;
for (const [id, inputMime, extension, output] of converters) test(`${id} downloads real ${output} bytes and clears output`, async ({ page }) => {
  await page.goto(`/tools/${id}`); await upload(page, inputMime, `fixture.${extension}`);
  await expect(page.getByAltText("Converted preview")).toBeVisible(); const result = await downloaded(page); const image = await inspect(page, result.bytes);
  expect([image.width, image.height]).toEqual([320, 200]); expect(result.name).toMatch(new RegExp(`\\.${output}$`));
  expect(image.black.slice(0, 3).every(channel => channel < 10)).toBe(true);
  expect(image.white.slice(0, 3).every(channel => channel > 245)).toBe(true);
  expect(image.black[3]).toBe(255); expect(image.white[3]).toBe(255);
  if (output === "png") expect(result.bytes.subarray(1, 4).toString()).toBe("PNG");
  if (output === "jpg") expect([...result.bytes.subarray(0, 3)]).toEqual([255, 216, 255]);
  if (output === "webp") expect(result.bytes.subarray(8, 12).toString()).toBe("WEBP");
  await page.getByRole("button", { name: "Clear", exact: true }).click(); await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
});
test("heic-to-jpg rejects malformed HEIC without a false download", async ({ page }) => {
  await page.goto("/tools/heic-to-jpg"); await page.locator('input[type="file"]').setInputFiles({ name: "unsupported.heic", mimeType: "image/heic", buffer: Buffer.from("unsupported input for decoder capability test") });
  await expect(page.getByText("Not a valid HEIC/HEIF image.")).toBeVisible(); await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
});
test("image-compressor exports JPEG with matching filename and dimensions", async ({ page }) => {
  await page.goto("/tools/image-compressor"); await upload(page); await expect(page.getByAltText("Compressed preview")).toBeVisible();
  const result = await downloaded(page); expect(result.name).toMatch(/\.jpg$/); expect([...result.bytes.subarray(0, 3)]).toEqual([255, 216, 255]);
  const image = await inspect(page, result.bytes); expect([image.width, image.height]).toEqual([320, 200]);
  expect(image.black.slice(0, 3).every(channel => channel < 10)).toBe(true);
  expect(image.white.slice(0, 3).every(channel => channel > 245)).toBe(true);
});
test("image-resizer rejects allocation bounds then exports the chosen dimensions", async ({ page }) => {
  await page.goto("/tools/image-resizer"); await upload(page); await expect(page.getByLabel("Width (px)")).toHaveValue("320");
  await page.getByLabel("Width (px)").fill("0"); await page.getByRole("button", { name: "Apply Resize", exact: true }).click(); await expect(page.getByText(/Dimensions must be positive integers/)).toBeVisible();
  await page.getByLabel("Width (px)").fill("160"); await page.getByRole("button", { name: "Apply Resize", exact: true }).click(); await expect(page.getByAltText("Resized preview")).toBeVisible();
  const image = await inspect(page, (await downloaded(page)).bytes); expect([image.width, image.height]).toEqual([160, 100]);
});
test("rotate-image swaps dimensions after 90 degrees", async ({ page }) => {
  await page.goto("/tools/rotate-image"); await upload(page); await expect(page.getByAltText("Rotated preview")).toBeVisible();
  await page.getByRole("button", { name: "Rotate 90", exact: false }).click();
  await expect.poll(() => page.getByAltText("Rotated preview").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(200);
  const image = await inspect(page, (await downloaded(page)).bytes); expect([image.width, image.height]).toEqual([200, 320]);
});
test("svg-converter exports scaled PNG and invalid markup removes stale output", async ({ page }) => {
  await page.goto("/tools/svg-converter"); await page.getByLabel("SVG Markup Code").fill('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="red"/></svg>');
  await expect(page.getByAltText("Exported PNG")).toBeVisible(); const image = await inspect(page, (await downloaded(page)).bytes); expect([image.width, image.height]).toEqual([320, 200]);
  expect(image.black).toEqual([255, 0, 0, 255]); expect(image.white).toEqual([255, 0, 0, 255]);
  await page.getByLabel("SVG Markup Code").fill("<svg broken"); await expect(page.getByText(/Enter a valid self-contained SVG/)).toBeVisible(); await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
});
for (const [id, mime, extension] of [["image-to-pdf", "image/png", "png"], ["jpg-to-pdf", "image/jpeg", "jpg"], ["png-to-pdf", "image/png", "png"]] as const) test(`${id} creates a readable PDF with actual image page dimensions`, async ({ page }) => {
  await page.goto(`/tools/${id}`); await upload(page, mime, `fixture.${extension}`); await page.getByRole("button", { name: "Generate PDF (1 page)", exact: true }).click(); await expect(page.getByText("PDF ready for download", { exact: true })).toBeVisible();
  const pdf = await PDFDocument.load((await downloaded(page)).bytes); expect(pdf.getPageCount()).toBe(1); expect(pdf.getPage(0).getSize()).toEqual({ width: 320, height: 200 });
  await page.getByRole("button", { name: "Clear", exact: true }).click(); await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
});
test("background-remover honestly removes selected black pixels while preserving white", async ({ page }) => {
  await page.goto("/tools/background-remover"); await expect(page.getByText(/not AI subject segmentation/)).toBeVisible(); await upload(page); await page.getByLabel("Background Color to Remove").fill("#000000");
  await expect(page.getByAltText("Transparent result")).toBeVisible();
  await expect.poll(async () => { const source = await page.getByAltText("Transparent result").getAttribute("src"); return page.evaluate(async (source) => { const image = await createImageBitmap(await (await fetch(source!)).blob()); const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height; const ctx = canvas.getContext("2d")!; ctx.drawImage(image, 0, 0); const alpha = ctx.getImageData(50, 100, 1, 1).data[3]; image.close(); return alpha; }, source); }).toBe(0);
  const image = await inspect(page, (await downloaded(page)).bytes); expect(image.black[3]).toBe(0); expect(image.white[3]).toBe(255);
});
test("image-upscaler exports a real double-sized raster and discloses its method", async ({ page }) => {
  await page.goto("/tools/image-upscaler"); await expect(page.getByText(/not an AI\/ML upscaler/)).toBeVisible(); await upload(page); await expect(page.getByAltText("Upscaled result")).toBeVisible();
  const image = await inspect(page, (await downloaded(page)).bytes); expect([image.width, image.height]).toEqual([640, 400]);
});
test("screenshot-tool annotates uploaded pixels and exports PNG rather than pretending capture", async ({ page }) => {
  await page.goto("/tools/screenshot-tool"); await upload(page); await page.getByLabel("Annotation Banner Text").fill("REVIEW"); await expect(page.getByAltText("Annotated preview")).toBeVisible();
  const result = await downloaded(page); expect(result.name).toMatch(/\.png$/); const image = await inspect(page, result.bytes); expect([image.width, image.height]).toEqual([320, 200]);
});
test("invalid raster files remove stale downloads and recover with valid input", async ({ page }) => {
  for (const id of ["image-compressor", "image-resizer", "rotate-image", "background-remover", "image-upscaler", "screenshot-tool"]) {
    await page.goto(`/tools/${id}`); await page.locator('input[type="file"]').setInputFiles({ name: "bad.png", mimeType: "image/png", buffer: Buffer.from("not image bytes") });
    await expect(page.getByText(/Could not decode this image/)).toBeVisible(); await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
    await upload(page); if (id === "image-resizer") { await expect(page.getByLabel("Width (px)")).toHaveValue("320"); await page.getByRole("button", { name: "Apply Resize", exact: true }).click(); }
    await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Clear", exact: true }).click(); await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  }
});
