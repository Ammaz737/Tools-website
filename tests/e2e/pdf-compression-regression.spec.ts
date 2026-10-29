import { test, expect } from "@playwright/test";
import { PDFDocument, StandardFonts, PDFName, PDFArray, PDFRawStream, PDFString, decodePDFRawStream } from "pdf-lib";
import { readFile, writeFile, mkdir } from "node:fs/promises";

function pageContent(document: PDFDocument, index: number) {
  const contents = document.getPage(index).node.Contents();
  const items = contents instanceof PDFArray ? contents.asArray() : [contents];
  return items.map(item => {
    const stream = document.context.lookup(item!);
    return stream instanceof PDFRawStream ? Buffer.from(decodePDFRawStream(stream).decode()).toString("hex") : "";
  }).join(":");
}

test("compression accepts long A4 PDFs, optimizes JPEGs and preserves text, links and page geometry", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/tools/compress-pdf");
  const jpeg = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 1000; canvas.height = 700;
    const context = canvas.getContext("2d")!; const pixels = context.createImageData(1000, 700);
    let seed = 23;
    for (let index = 0; index < pixels.data.length; index += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      pixels.data[index] = seed & 255; pixels.data[index + 1] = (seed >>> 8) & 255; pixels.data[index + 2] = (seed >>> 16) & 255; pixels.data[index + 3] = 255;
    }
    context.putImageData(pixels, 0, 0); return canvas.toDataURL("image/jpeg", 1).split(",")[1];
  });
  const source = await PDFDocument.create();
  const image = await source.embedJpg(Buffer.from(jpeg, "base64"));
  const font = await source.embedFont(StandardFonts.Helvetica);
  for (let index = 0; index < 62; index++) {
    const size: [number, number] = index === 61 ? [6000, 4000] : index === 60 ? [842, 595] : [595, 842];
    const sheet = source.addPage(size);
    sheet.drawText(`SELECTABLE TEXT PAGE ${index + 1}`, { x: 30, y: size[1] - 40, font, size: 16 });
    sheet.drawImage(image, { x: 30, y: 60, width: 450, height: 315 });
  }
  source.getPage(0).node.set(PDFName.of("Annots"), source.context.obj([{ Type: "Annot", Subtype: "Link", Rect: [30, 770, 200, 810], A: { S: "URI", URI: PDFString.of("https://example.com") } }]));
  const original = Buffer.from(await source.save());
  const baseline = await PDFDocument.load(original);
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST" && !request.url().includes("/use")) posts.push(request.url()); });
  await mkdir(test.info().outputDir, { recursive: true });
  const input = test.info().outputPath("long.pdf"); await writeFile(input, original);
  await page.locator('input[type="file"]').first().setInputFiles(input);
  await expect(page.getByLabel("Compression mode")).toHaveValue("preserve");
  await page.getByRole("button", { name: "Compress PDF", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const bytes = await readFile((await (await pending).path())!);
  expect(bytes.length).toBeLessThan(original.length * 0.9);
  const output = await PDFDocument.load(bytes);
  expect(output.getPageCount()).toBe(62);
  for (let index = 0; index < 62; index++) {
    expect(output.getPage(index).getSize()).toEqual(source.getPage(index).getSize());
    expect(pageContent(output, index)).toBe(pageContent(baseline, index));
  }
  expect(output.getPage(0).node.Annots()?.size()).toBe(1);
  expect(posts).toEqual([]);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, 0); });
  await page.screenshot({ path: test.info().outputPath("compression-fixed.png"), fullPage: true });
});

test("flatten compression preserves physical portrait and landscape sizes", async ({ page }) => {
  await page.goto("/tools/compress-pdf");
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 1200;
    const context = canvas.getContext("2d")!; const data = context.createImageData(1200, 1200);
    for (let index = 0; index < data.data.length; index++) data.data[index] = index % 4 === 3 ? 255 : (index * 17 + (index >>> 6)) & 255;
    context.putImageData(data, 0, 0); return canvas.toDataURL("image/png").split(",")[1];
  });
  const source = await PDFDocument.create(); const png = await source.embedPng(Buffer.from(image, "base64"));
  for (const size of [[300, 400], [500, 300]] as [number, number][]) source.addPage(size).drawImage(png, { x: 0, y: 0, width: size[0], height: size[1] });
  await page.locator('input[type="file"]').first().setInputFiles({ name: "mixed.pdf", mimeType: "application/pdf", buffer: Buffer.from(await source.save()) });
  await page.getByLabel("Compression mode").selectOption("flatten");
  await page.getByLabel("Compression level").selectOption("low");
  await page.getByRole("button", { name: "Compress PDF", exact: true }).click();
  const pending = page.waitForEvent("download"); await page.getByRole("button", { name: "Download", exact: true }).click();
  const output = await PDFDocument.load(await readFile((await (await pending).path())!));
  expect(output.getPages().map(sheet => sheet.getSize())).toEqual([{ width: 300, height: 400 }, { width: 500, height: 300 }]);
});
