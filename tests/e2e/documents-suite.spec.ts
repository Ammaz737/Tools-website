import { test, expect, type Page } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { mkdir, open, readFile } from "node:fs/promises";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph } from "docx";
import PptxGenJS from "pptxgenjs";

async function pdfFixture(pages = 3) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) { const page = document.addPage([300 + i * 10, 400]); page.drawText(`Fixture page ${i + 1}: document verification`, { x: 20, y: 300, size: 12, font }); }
  return Buffer.from(await document.save());
}
async function upload(page: Page, bytes: Buffer, name = "fixture.pdf") {
  await page.locator('input[type="file"]').first().setInputFiles({ name, mimeType: name.endsWith("pdf") ? "application/pdf" : "application/octet-stream", buffer: bytes });
}
async function output(page: Page) {
  const ready = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  return readFile((await (await ready).path())!);
}
const pdfCases = [
  { slug: "split-pdf", button: "Extract pages", count: 2, field: "Page range", value: "1-2" },
  { slug: "delete-pdf-pages", button: "Delete selected pages", count: 2, field: /^Pages to delete/, value: "2" },
  { slug: "rearrange-pdf-pages", button: "Apply new page order", count: 3, field: /^New page order/, value: "3, 1, 2" },
  { slug: "rotate-pdf", button: "Rotate all pages", count: 3 },
  { slug: "watermark-pdf", button: "Apply watermark", count: 3, field: "Watermark text", value: "VERIFIED" },
  { slug: "sign-pdf", button: "Apply signature", count: 3, field: "Signature name", value: "Test Signer" },
  { slug: "edit-pdf", button: "Apply to PDF", count: 3, field: "Overlay text", value: "Verified annotation" },
  { slug: "compress-pdf", button: "Compress PDF", count: 3 },
];
for (const item of pdfCases) test(`${item.slug} downloads a reopened PDF with the expected pages`, async ({ page }) => {
  await page.goto(`/tools/${item.slug}`); await upload(page, await pdfFixture());
  if (item.field) await page.getByLabel(item.field).fill(item.value!);
  await page.getByRole("button", { name: item.button, exact: true }).click();
  const bytes = await output(page); const document = await PDFDocument.load(bytes);
  expect(document.getPageCount()).toBe(item.count);
  if (item.slug === "rotate-pdf") expect(document.getPage(0).getRotation().angle).toBe(90);
  if (item.slug === "rearrange-pdf-pages") expect(document.getPages().map((entry) => entry.getWidth())).toEqual([320, 300, 310]);
  if (item.slug === "compress-pdf") expect(bytes.length).toBeGreaterThan(0); // Size reduction depends on input; no fabricated savings assertion.
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  if (item.slug !== "rotate-pdf") {
    // Parse the downloaded artifact independently of the Word conversion UI.
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
    const parsed = await task.promise;
    let text = "";
    try {
      for (let number = 1; number <= parsed.numPages; number++) {
        const contents = await (await parsed.getPage(number)).getTextContent();
        text += contents.items.flatMap(item => "str" in item ? [item.str] : []).join(" ") + "\n";
      }
    } finally { await task.destroy(); }
    expect(text).toContain("Fixture page 1");
    if (item.slug === "delete-pdf-pages") { expect(text).not.toContain("Fixture page 2"); expect(text).toContain("Fixture page 3"); }
    if (item.slug === "split-pdf") { expect(text).toContain("Fixture page 2"); expect(text).not.toContain("Fixture page 3"); }
    if (item.slug === "watermark-pdf") expect(text).toContain("VERIFIED");
    if (item.slug === "sign-pdf") expect(text).toContain("Signed by: Test Signer");
    if (item.slug === "edit-pdf") expect(text).toContain("Verified annotation");
  }
});
test("merge combines generated page geometry", async ({ page }) => {
  await page.goto("/tools/merge-pdf");
  const bytes = await pdfFixture(1);
  await page.locator('input[type="file"]').setInputFiles([{ name: "one.pdf", mimeType: "application/pdf", buffer: bytes }, { name: "two.pdf", mimeType: "application/pdf", buffer: bytes }]);
  await page.getByRole("button", { name: "Merge 2 PDFs", exact: true }).click();
  expect((await PDFDocument.load(await output(page))).getPageCount()).toBe(2);
});
for (const format of ["jpg", "png"]) test(`PDF to ${format} produces real image signatures in ZIP`, async ({ page }) => {
  await page.goto(`/tools/pdf-to-${format}`); await upload(page, await pdfFixture(2));
  await page.getByRole("button", { name: "Convert PDF pages", exact: true }).click();
  const archive = await JSZip.loadAsync(await output(page));
  const images = Object.values(archive.files).filter((entry) => !entry.dir);
  expect(images).toHaveLength(2);
  for (const image of images) {
    const bytes = await image.async("uint8array");
    expect(Array.from(bytes.slice(0, format === "png" ? 4 : 2))).toEqual(format === "png" ? [137, 80, 78, 71] : [255, 216]);
  }
});
test("protect and unlock enforce password and reopen decrypted output", async ({ page }) => {
  await page.goto("/tools/protect-pdf"); await upload(page, await pdfFixture(1));
  await page.getByLabel("Password", { exact: true }).fill("SafeTest123!");
  await page.getByLabel("Confirm password", { exact: true }).fill("SafeTest123!");
  await page.getByRole("button", { name: "Encrypt & protect PDF", exact: true }).click();
  const encrypted = await output(page);
  await expect(PDFDocument.load(encrypted)).rejects.toThrow(/encrypted/i);
  await page.goto("/tools/unlock-pdf"); await upload(page, encrypted);
  await page.getByLabel("PDF password").fill("SafeTest123!");
  await page.getByRole("button", { name: "Unlock & download", exact: true }).click();
  expect((await PDFDocument.load(await output(page))).getPageCount()).toBe(1);
});
test("drawn signature uses real pointer interaction", async ({ page }) => {
  await page.goto("/tools/sign-pdf"); await upload(page, await pdfFixture(1));
  await page.getByLabel("Signature style").selectOption("draw");
  const bounds = await page.locator("canvas").boundingBox(); expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + 30, bounds!.y + 60); await page.mouse.down();
  await page.mouse.move(bounds!.x + 120, bounds!.y + 30, { steps: 10 });
  await page.mouse.move(bounds!.x + 200, bounds!.y + 90, { steps: 10 }); await page.mouse.up();
  await page.getByRole("button", { name: "Apply signature", exact: true }).click();
  expect((await PDFDocument.load(await output(page))).getPageCount()).toBe(1);
});
for (const target of ["word", "excel", "ppt"]) test(`PDF to ${target} output reopens as the requested Office format`, async ({ page }) => {
  await page.goto(`/tools/pdf-to-${target === "ppt" ? "powerpoint" : target}`); await upload(page, await pdfFixture(1));
  if (target === "word") await page.getByLabel("Word conversion mode").selectOption("editable");
  await page.getByRole("button", { name: /^Convert Document/ }).click();
  const bytes = await output(page);
  if (target === "excel") {
    const book = XLSX.read(bytes); expect(book.SheetNames).toHaveLength(1);
    expect(JSON.stringify(book.Sheets[book.SheetNames[0]])).toContain("Fixture page");
  } else {
    const zip = await JSZip.loadAsync(bytes);
    expect(zip.file(target === "word" ? "word/document.xml" : "ppt/presentation.xml")).not.toBeNull();
    if (target === "word") expect(await zip.file("word/document.xml")!.async("string")).toContain("Fixture page");
  }
});
for (const source of ["word", "excel", "ppt"]) test(`${source} to PDF generated fixture reopens`, async ({ page }) => {
  let bytes: Buffer; let name: string;
  if (source === "word") { bytes = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph("Document fixture verified")] }] })); name = "fixture.docx"; }
  else if (source === "excel") { const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Fixture", 42]]), "Sheet1"); bytes = Buffer.from(XLSX.write(book, { type: "buffer", bookType: "xlsx" })); name = "fixture.xlsx"; }
  else { const presentation = new PptxGenJS(); presentation.addSlide().addText("Document fixture verified", { x: 1, y: 1, w: 6, h: 1 }); bytes = Buffer.from(await presentation.write({ outputType: "arraybuffer" }) as ArrayBuffer); name = "fixture.pptx"; }
  await page.goto(`/tools/${source === "ppt" ? "powerpoint" : source}-to-pdf`); await upload(page, bytes, name);
  await page.getByRole("button", { name: /^Convert Document/ }).click();
  expect((await PDFDocument.load(await output(page))).getPageCount()).toBeGreaterThan(0);
});
test("all PDF routes reject malformed bytes before preview or processing", async ({ page }) => {
  const slugs = [...pdfCases.map((item) => item.slug), "merge-pdf", "protect-pdf", "unlock-pdf", "pdf-to-jpg", "pdf-to-png", "ocr-pdf"];
  for (const slug of slugs) {
    await page.goto(`/tools/${slug}`); await upload(page, Buffer.from("not a PDF"));
    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toContainText("valid PDF");
    await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  }
});
test("PDF uploads enforce page and byte budgets", async ({ page }) => {
  await page.goto("/tools/split-pdf"); await upload(page, await pdfFixture(51));
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toContainText("50-page");
  // Select a real oversized file rather than serializing 41MB through CDP.
  await mkdir(test.info().outputDir, { recursive: true });
  const oversizedPath = test.info().outputPath("oversized.pdf");
  const oversized = await open(oversizedPath, "w");
  try { await oversized.truncate(41 * 1024 * 1024); } finally { await oversized.close(); }
  await page.locator('input[type="file"]').first().setInputFiles(oversizedPath);
  await expect(page.getByText(/too large|40MB|40 MB/i).first()).toBeVisible();
});
