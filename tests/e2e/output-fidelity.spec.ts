import { test, expect, type Page } from "@playwright/test";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import PptxGenJS from "pptxgenjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// A semantic/layout fixture, rather than the old single-line smoke document.
async function fixture() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const [index, size] of [[420, 595], [595, 420]].entries()) {
    const page = pdf.addPage([size[0], size[1]]);
    page.drawRectangle({ x: 4, y: 4, width: size[0] - 8, height: size[1] - 8, borderColor: rgb(1, 0, 0), borderWidth: 2 });
    page.drawText(`Quality fixture page ${index + 1}`, { x: 20, y: size[1] - 40, font, size: 18 });
    for (let row = 0; row < 4; row++) {
      const y = size[1] - 100 - row * 30;
      page.drawRectangle({ x: 20, y, width: 300, height: 30, borderColor: rgb(0, 0, 0), borderWidth: 1 });
      page.drawLine({ start: { x: 170, y }, end: { x: 170, y: y + 30 }, color: rgb(0, 0, 0), thickness: 1 });
      page.drawText(`Item ${row + 1}`, { x: 25, y: y + 10, font, size: 12 });
      page.drawText(`${(row + 1) * 125}.00`, { x: 180, y: y + 10, font, size: 12 });
    }
    page.drawRectangle({ x: 20, y: 40, width: 100, height: 60, color: rgb(0, 0.4, 0.8) });
    page.drawText("Footer must remain visible", { x: 20, y: 16, font, size: 10 });
  }
  return Buffer.from(await pdf.save());
}
async function setFile(page: Page, bytes: Buffer, name: string) {
  await mkdir(test.info().outputDir, { recursive: true });
  const input = test.info().outputPath(name);
  await writeFile(input, bytes);
  await page.locator('input[type="file"]').first().setInputFiles(input);
}
async function upload(page: Page, bytes: Buffer, name: string) {
  await setFile(page, bytes, name);
  await page.getByRole("button", { name: /^Convert Document/ }).click();
}
async function download(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  return readFile((await (await pending).path())!);
}
test("PDF to Word page images survive mixed-size document round trip", async ({ page }) => {
  test.setTimeout(120_000);
  const directory = "docs/quality-evidence/pdf-to-word";
  await mkdir(directory, { recursive: true });
  const source = await fixture();
  await writeFile(`${directory}/source.pdf`, source);
  await page.goto("/tools/pdf-to-word");
  await page.locator('input[type="file"]').first().setInputFiles(`${directory}/source.pdf`);
  await page.getByRole("button", { name: /^Convert Document/ }).click();
  const word = await download(page);
  await writeFile(`${directory}/page-images.docx`, word);
  const zip = await JSZip.loadAsync(word);
  const xml = await zip.file("word/document.xml")!.async("string");
  expect((xml.match(/<w:drawing>/g) ?? []).length).toBe(2);
  expect(xml).toContain('w:w="8400" w:h="11900"');
  expect(xml).toContain('w:w="11900" w:h="8400"');
  const images = Object.values(zip.files).filter(entry => entry.name.startsWith("word/media/") && !entry.dir);
  expect(images).toHaveLength(2);
  for (const [index, image] of images.entries()) await writeFile(`${directory}/embedded-${index + 1}.png`, await image.async("nodebuffer"));
  await page.goto("/tools/word-to-pdf");
  await upload(page, word, "quality.docx");
  const roundTrip = await download(page);
  await writeFile(`${directory}/round-trip.pdf`, roundTrip);
  const restored = await PDFDocument.load(roundTrip);
  expect(restored.getPageCount()).toBe(2);
  for (const [index, expected] of [[420, 595], [595, 420]].entries()) {
    expect(restored.getPage(index).getWidth()).toBeCloseTo(expected[0], 0);
    expect(restored.getPage(index).getHeight()).toBeCloseTo(expected[1], 0);
  }
  for (let index = 0; index < 2; index++) {
    const preview = page.getByAltText(`Page ${index + 1} preview`);
    await expect(preview).toBeVisible({ timeout: 30000 });
    const bytes = await preview.evaluate(async (img: HTMLImageElement) => Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer())));
    await writeFile(`${directory}/round-trip-${index + 1}.png`, Buffer.from(bytes));
    // Compare actual downloaded DOCX after rendering, not its source preview.
    const original = await images[index].async("base64");
    const difference = await page.evaluate(async ({ original, rendered }) => {
      const load = async (url: string) => { const image = new Image(); image.src = url; await image.decode(); return image; };
      const [source, output] = await Promise.all([load(`data:image/png;base64,${original}`), load(`data:image/png;base64,${rendered}`)]);
      const pixels = (image: HTMLImageElement) => {
        const canvas = document.createElement("canvas"); canvas.width = 420; canvas.height = 420;
        const context = canvas.getContext("2d")!; context.fillStyle = "white"; context.fillRect(0, 0, 420, 420);
        context.drawImage(image, 0, 0, 420, 420); return context.getImageData(0, 0, 420, 420).data;
      };
      const a = pixels(source), b = pixels(output);
      let delta = 0; for (let i = 0; i < a.length; i++) delta += Math.abs(a[i] - b[i]);
      return delta / a.length;
    }, { original, rendered: Buffer.from(bytes).toString("base64") });
    expect(difference, `page ${index + 1} mean channel error`).toBeLessThan(3);
    await writeFile(`${directory}/page-${index + 1}-comparison.json`, JSON.stringify({ meanChannelError: difference, allowed: 3 }, null, 2));
  }
});
test("PDF to Word editable mode reconstructs table cells and source page sections", async ({ page }) => {
  await page.goto("/tools/pdf-to-word");
  await setFile(page, await fixture(), "quality.pdf");
  await page.getByLabel("Word conversion mode").selectOption("editable");
  await page.getByRole("button", { name: /^Convert Document/ }).click();
  const bytes = await download(page);
  await mkdir("docs/quality-evidence/pdf-to-word", { recursive: true });
  await writeFile("docs/quality-evidence/pdf-to-word/editable.docx", bytes);
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file("word/document.xml")!.async("string");
  for (const text of ["Quality fixture page 1", "Quality fixture page 2", "Item 4", "500.00", "Footer must remain visible"]) expect(xml).toContain(text);
  expect((xml.match(/<w:tbl>/g) ?? []).length).toBe(2);
  expect((xml.match(/<w:tc>/g) ?? []).length).toBe(16);
  expect((xml.match(/<w:sectPr\b/g) ?? []).length).toBe(2);
  expect(xml).not.toContain("<w:drawing>");
  await page.goto("/tools/word-to-pdf");
  await upload(page, bytes, "editable.docx");
  const rendered = await download(page);
  await writeFile("docs/quality-evidence/pdf-to-word/editable-rendered.pdf", rendered);
  expect((await PDFDocument.load(rendered)).getPageCount()).toBe(2);
  for (let index = 0; index < 2; index++) {
    const preview = page.getByAltText(`Page ${index + 1} preview`);
    await expect(preview).toBeVisible({ timeout: 30000 });
    const png = await preview.evaluate(async (img: HTMLImageElement) => Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer())));
    await writeFile(`docs/quality-evidence/pdf-to-word/editable-page-${index + 1}.png`, Buffer.from(png));
  }

});

test("PDF to Excel preserves blank middle pages and later-page assignment", async ({ page }) => {
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("FIRST PAGE");
  pdf.addPage();
  pdf.addPage().drawText("THIRD PAGE");
  await page.goto("/tools/pdf-to-excel");
  await upload(page, Buffer.from(await pdf.save()), "blank-middle.pdf");
  const book = XLSX.read(await download(page));
  expect(book.SheetNames).toHaveLength(3);
  expect(JSON.stringify(book.Sheets[book.SheetNames[0]])).toContain("FIRST PAGE");
  expect(JSON.stringify(book.Sheets[book.SheetNames[1]])).not.toContain("THIRD PAGE");
  expect(JSON.stringify(book.Sheets[book.SheetNames[2]])).toContain("THIRD PAGE");
});

test("PowerPoint rejects unsupported mixed content instead of downloading damaged output", async ({ page }) => {
  const deck = new PptxGenJS();
  const slide = deck.addSlide();
  slide.addText("This heading must not silently disappear", { x: 1, y: 1, w: 6, h: 1 });
  slide.addImage({ data: "image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", x: 1, y: 3, w: 1, h: 1 });
  const bytes = Buffer.from(await deck.write({ outputType: "arraybuffer" }) as ArrayBuffer);
  await page.goto("/tools/powerpoint-to-pdf");
  await upload(page, bytes, "mixed.pptx");
  await expect(page.getByText(/Slides with multiple images or mixed images and text cannot be converted reliably here/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
});

test("PDF to Excel reconstructs detected table cells instead of a single text column", async ({ page }) => {
  await page.goto("/tools/pdf-to-excel");
  await upload(page, await fixture(), "table.pdf");
  const book = XLSX.read(await download(page));
  expect(book.SheetNames).toHaveLength(2);
  for (const name of book.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<string[]>(book.Sheets[name], { header: 1 });
    const first = rows.find(row => row[0] === "Item 1");
    const last = rows.find(row => row[0] === "Item 4");
    expect(first).toEqual(["Item 1", "125.00"]);
    expect(last).toEqual(["Item 4", "500.00"]);
    expect(rows.flat().filter(value => value === "Content")).toHaveLength(0);
  }
});

test("PDF page-image PowerPoint round trip preserves declared slide dimensions", async ({ page }) => {
  await page.goto("/tools/pdf-to-powerpoint");
  await upload(page, await fixture(), "slides.pdf");
  const deck = await download(page);
  const zip = await JSZip.loadAsync(deck);
  const xml = await zip.file("ppt/presentation.xml")!.async("string");
  expect(xml).toContain('cx="5334000"');
  expect(xml).toContain('cy="7556500"');
  await page.goto("/tools/powerpoint-to-pdf");
  await upload(page, deck, "slides.pptx");
  const pdf = await PDFDocument.load(await download(page));
  expect(pdf.getPageCount()).toBe(2);
  // A PowerPoint deck has one global slide size; the second source page is
  // contained without stretching, rather than inventing per-slide sizes.
  for (const page of pdf.getPages()) {
    expect(page.getWidth()).toBeCloseTo(420, 1);
    expect(page.getHeight()).toBeCloseTo(595, 1);
  }
});

test("PDF canvas export recovers from an unreadable encoder Blob without changing pixels", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
      original.call(this, blob => {
        if (blob) Object.defineProperty(blob, "arrayBuffer", { value: async () => { throw new DOMException("Injected encoder read failure", "NotReadableError"); } });
        callback(blob);
      }, type, quality);
    };
  });
  const pdf = await PDFDocument.create();
  pdf.addPage([100, 80]).drawRectangle({ x: 0, y: 0, width: 100, height: 80, color: rgb(0, 0.4, 0.8) });
  await page.goto("/tools/pdf-to-word");
  await upload(page, Buffer.from(await pdf.save()), "canvas-recovery.pdf");
  const zip = await JSZip.loadAsync(await download(page));
  const media = Object.values(zip.files).filter(entry => entry.name.startsWith("word/media/") && !entry.dir);
  expect(media).toHaveLength(1);
  const png = await media[0].async("nodebuffer");
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([300, 240]);
  const pixel = await page.evaluate(async encoded => {
    const image = new Image(); image.src = `data:image/png;base64,${encoded}`; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
    return [...context.getImageData(150, 120, 1, 1).data];
  }, png.toString("base64"));
  expect(pixel).toEqual([0, 102, 204, 255]);
});
