import assert from "node:assert/strict";
import test from "node:test";
import {
  parsePageSelection,
  pdfRenderScale,
  validatePdfBytes,
} from "../lib/pdf-ops";
import { PDFDocument } from "pdf-lib";

test("page selection expands ranges to zero-based indices in requested order", () => {
  assert.deepEqual(parsePageSelection("1-3, 5, 8-9", 10), [0, 1, 2, 4, 7, 8]);
  assert.deepEqual(parsePageSelection("5, 1-3", 5), [4, 0, 1, 2]);
});

test("ordinary long PDFs no longer fail a cumulative page-area or 50-page gate", async () => {
  const document = await PDFDocument.create();
  for (let index = 0; index < 120; index++) document.addPage([595.28, 841.89]);
  await validatePdfBytes(await document.save());
});

test("valid large-format pages are accepted and rendered with a bounded canvas", async () => {
  const document = await PDFDocument.create();
  document.addPage([6000, 4000]);
  await validatePdfBytes(await document.save());
  const scale = pdfRenderScale(6000, 4000, 3);
  assert.ok(6000 * 4000 * scale * scale <= 8_000_001);
  assert.ok(6000 * scale <= 4096);
  assert.equal(pdfRenderScale(300, 400, 2), 2);
  assert.throws(() => pdfRenderScale(Infinity, 100, 2), /dimensions/);
});

test("PDF validation keeps malformed data and explicit file budgets rejected", async () => {
  await assert.rejects(
    validatePdfBytes(new Uint8Array([1, 2, 3])),
    /valid PDF/,
  );
  await assert.rejects(
    validatePdfBytes(new Uint8Array(2 * 1024 * 1024), { maxSizeMB: 1 }),
    /1 MB/,
  );
});

test("page selection handles reversed ranges and removes duplicates", () => {
  assert.deepEqual(parsePageSelection("4-2, 3, 1, 4", 5), [1, 2, 3, 0]);
});

test("page selection ignores out-of-bounds pages, blanks, and nonnumeric tokens", () => {
  assert.deepEqual(parsePageSelection("0, 1-5, 8, unknown, ,", 3), [0, 1, 2]);
  assert.deepEqual(parsePageSelection("", 3), []);
  assert.deepEqual(parsePageSelection("1-3", 0), []);
});
