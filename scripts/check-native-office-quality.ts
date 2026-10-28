import { readFile, writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import PptxGenJS from "pptxgenjs";
import * as XLSX from "xlsx";
import { PDFDocument } from "pdf-lib";
import { createHash } from "node:crypto";

async function main() {
const { getDocument, OPS } = await import("pdfjs-dist/legacy/build/pdf.mjs");

// Own-process defaults only. No live Atlas writes or AI/provider requests.
process.env.MONGODB_URI = "";
process.env.OFFICE_CONVERTER_URL ||= "http://127.0.0.1:3101";
const { POST } = await import("../app/api/convert-office/route");
const directory = "docs/quality-evidence/native-office";
await mkdir(directory, { recursive: true });
const book = XLSX.utils.book_new();
const sheet = XLSX.utils.aoa_to_sheet([["Product", "Amount"], ["Native alpha", 10], ["Native beta", 20], ["Calculated total", 30]]);
sheet.B4 = { t: "n", f: "SUM(B2:B3)", v: 999 }; sheet["!cols"] = [{ wch: 28 }, { wch: 16 }];
XLSX.utils.book_append_sheet(book, sheet, "Invoice");
XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Second sheet survives"], ["Native sheet marker"]]), "Second");
const deck = new PptxGenJS(); deck.defineLayout({ name: "QA", width: 10, height: 5 }); deck.layout = "QA";
const slide = deck.addSlide(); slide.addText("Mixed content heading survives", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 26 });
slide.addShape(deck.ShapeType.rect, { x: 0.5, y: 1.5, w: 2, h: 1, fill: { color: "0066CC" }, line: { color: "0066CC" } });
slide.addImage({ data: "image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", x: 4, y: 1.5, w: 1, h: 1 });
slide.addText("Body text beside graphics", { x: 5.5, y: 1.5, w: 4, h: 1, fontSize: 18 });
deck.addSlide().addText("Native second slide", { x: 0.5, y: 0.5, w: 9, h: 1 });
const cases = [
  { name: "page-images", format: "docx", tool: "word-to-pdf", bytes: await readFile("docs/quality-evidence/pdf-to-word/page-images.docx"), pages: 2, text: [], sizes: [[420, 595], [595, 420]], image: true },
  { name: "editable-tables", format: "docx", tool: "word-to-pdf", bytes: await readFile("docs/quality-evidence/pdf-to-word/editable.docx"), pages: 2, text: ["Quality fixture page 1", "Quality fixture page 2", "Item 1", "125.00", "Item 4", "500.00", "Footer must remain visible"], sizes: [[420, 595], [595, 420]], image: false },
  { name: "spreadsheet", format: "xlsx", tool: "excel-to-pdf", bytes: Buffer.from(XLSX.write(book, { type: "buffer", bookType: "xlsx" })), pages: 2, text: ["Native alpha", "Native beta", "Calculated total", "30", "Second sheet survives"], sizes: [], image: false },
  { name: "mixed-slides", format: "pptx", tool: "powerpoint-to-pdf", bytes: Buffer.from(await deck.write({ outputType: "arraybuffer" }) as ArrayBuffer), pages: 2, text: ["Mixed content heading survives", "Body text beside graphics", "Native second slide"], sizes: [[720, 360], [720, 360]], image: true },
];
const results = [];
for (const item of cases) {
  const started = Date.now();
  await writeFile(`${directory}/${item.name}.${item.format}`, item.bytes);
  try {
    const request = new Request(`http://localhost/api/convert-office?toolId=${item.tool}&format=${item.format}`, { method: "POST", headers: { origin: "http://localhost", "content-type": "application/octet-stream" }, body: item.bytes });
    const response = await POST(request);
    if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    await writeFile(`${directory}/${item.name}.pdf`, bytes);
    const pdf = await PDFDocument.load(bytes); assert.equal(pdf.getPageCount(), item.pages);
    for (const [index, size] of item.sizes.entries()) { const actual = pdf.getPage(index).getSize(); assert.ok(Math.abs(actual.width - size[0]) < 1 && Math.abs(actual.height - size[1]) < 1, `page ${index + 1} dimensions ${actual.width}x${actual.height}`); }
    const loading = getDocument({ data: bytes.slice(), useSystemFonts: true });
    const document = await loading.promise; const texts: string[] = []; let images = 0;
    try {
      for (let index = 1; index <= document.numPages; index++) {
        const page = await document.getPage(index); const content = await page.getTextContent();
        texts.push(content.items.map(value => "str" in value ? value.str : "").join(" "));
        const operators = await page.getOperatorList(); images += operators.fnArray.filter(value => value === OPS.paintImageXObject || value === OPS.paintInlineImageXObject).length;
      }
    } finally { await loading.destroy(); }
    const text = texts.join(" ").replace(/\s+/g, " "); for (const expected of item.text) assert.ok(text.includes(expected), `missing ${expected}`);
    if (item.name === "spreadsheet") assert.ok(!text.includes("999"), "stale formula cache must be recalculated");
    if (item.image) assert.ok(images > 0, "image objects must survive");
    results.push({ name: item.name, status: "PASS", pages: pdf.getPageCount(), pageSizes: pdf.getPages().map(page => page.getSize()), images, textByPage: texts, durationMs: Date.now() - started, sha256: createHash("sha256").update(bytes).digest("hex") });
  } catch (error) { results.push({ name: item.name, status: "FAIL", error: error instanceof Error ? error.message : "Conversion failed", durationMs: Date.now() - started }); }
}
const evidenceFiles = ["lib/server/office-conversion.ts", "app/api/convert-office/route.ts", "lib/docx-from-text.ts", "infra/office-converter/Dockerfile", "infra/office-converter/configure-calc.py", "infra/office-converter/compose.yaml", "infra/office-converter/compose.local.yaml", "package-lock.json"];
const sourceHashes = Object.fromEntries(await Promise.all(evidenceFiles.map(async file => [file, createHash("sha256").update(await readFile(file)).digest("hex")])));
await writeFile("docs/native-office-quality-results.json", JSON.stringify({ sourceHashes, checkedAt: new Date().toISOString(), scope: "Actual application POST handler and local Gotenberg/LibreOffice. Fixtures cover tables, page images, formulas, multiple sheets and mixed-content slides; visual rendering must be reviewed separately. No Atlas or paid provider calls.", results }, null, 2) + "\n");
console.log(results.map(({ name, status, ...rest }) => ({ name, status, ...("error" in rest ? { error: rest.error } : {}) })));
if (results.some(result => result.status !== "PASS")) process.exitCode = 1;

}
void main().catch(() => { console.error("Native verification harness could not complete"); process.exitCode = 1; });
