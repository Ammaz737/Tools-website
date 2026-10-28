import { test, expect, type Page } from "@playwright/test";
import { PDFDocument, PDFArray, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { readFile } from "node:fs/promises";
async function download(page: Page) {
  const ready = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  return readFile((await (await ready).path())!);
}
test("ocr-pdf reads image-only English pages and preserves searchable page dimensions", async ({ page }) => {
  test.setTimeout(180_000);
  const external: string[] = []; const workers: string[] = [];
  page.on("request", (r) => { if (!r.url().startsWith("http://127.0.0.1:3100/") && /^https?:/.test(r.url())) external.push(r.url()); });
  page.on("worker", (w) => workers.push(w.url()));
  await page.goto("/tools/ocr-pdf");
  const images = await page.evaluate(() => ["INVOICE NUMBER 4821", "TOTAL AMOUNT 1250"].map((text) => {
    const canvas = document.createElement("canvas"); canvas.width = 1400; canvas.height = 600;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black"; context.font = "bold 56px Arial"; context.fillText(text, 80, 180);
    context.font = "40px Arial"; context.fillText("Quality verification document", 80, 300);
    return canvas.toDataURL("image/png").split(",")[1];
  }));
  const source = await PDFDocument.create();
  for (const image of images) { const png = await source.embedPng(Buffer.from(image, "base64")); source.addPage([700, 300]).drawImage(png, { x: 0, y: 0, width: 700, height: 300 }); }
  await page.locator('input[type="file"]').setInputFiles({ name: "english-scan.pdf", mimeType: "application/pdf", buffer: Buffer.from(await source.save()) });
  await page.getByLabel("Output", { exact: true }).selectOption("txt");
  await page.getByRole("button", { name: "Run OCR", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible({ timeout: 120_000 });
  const text = (await download(page)).toString("utf8");
  expect(text).toContain("INVOICE NUMBER 4821"); expect(text).toContain("TOTAL AMOUNT 1250");
  expect(text.match(/Quality verification document/g)).toHaveLength(2);
  expect(workers.filter((url) => url.includes("/ocr/worker"))).toHaveLength(1);
  await page.getByLabel("Output", { exact: true }).selectOption("pdf");
  await page.getByRole("button", { name: "Run OCR", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible({ timeout: 120_000 });
  const output = await PDFDocument.load(await download(page)); expect(output.getPageCount()).toBe(2);
  for (const sheet of output.getPages()) expect(sheet.getSize()).toEqual({ width: 700, height: 300 });
  const streams = output.getPages().map((sheet) => {
    const contents = sheet.node.Contents();
    const items = contents instanceof PDFArray ? contents.asArray() : [contents];
    return items.map((item) => {
      const stream = output.context.lookup(item!);
      return stream instanceof PDFRawStream ? new TextDecoder().decode(decodePDFRawStream(stream).decode()) : "";
    }).join("\n");
  });
  expect(streams[0]).toContain(Buffer.from("INVOICE NUMBER 4821").toString("hex").toUpperCase());
  expect(streams[1]).toContain(Buffer.from("TOTAL AMOUNT 1250").toString("hex").toUpperCase());
  expect(external).toEqual([]);
});
