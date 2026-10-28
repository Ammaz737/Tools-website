# OCR output quality audit

Checkpoint: 2026-10-16 (Asia/Karachi). Browser execution pending; this is not an OCR accuracy PASS yet.

OCR now uses one Tesseract worker and one PDF.js document per operation. Page canvases are released after recognition; the OCR worker terminates on success/failure/cancellation and the PDF loading task is destroyed. Replacing the upload or leaving cancels the run. A worker resolving after its deadline is terminated. A bootstrap closes never-settling initialization workers after 185 seconds.

Limits: existing 40 MB document validation, 10 OCR pages, maximum 3200 pixel edge and 8 million rendered pixels per page, 60-second initialization, 45-second processing operations, 180-second overall deadline. Rendering is sequential and yields between pages. A blocked event loop can delay timers; these are browser bounds rather than server resource isolation.

Assets are served exclusively from `/ocr/`: Tesseract.js 5.1.1 worker and Tesseract.js-core 5.1.1 LSTM cores from locked dependencies, plus official English data. No processing upload or public CDN fallback is configured. SIMD and non-SIMD cores are included. `node scripts/prepare-ocr-assets.mjs` refreshes installed worker/core copies and verifies the language checksum. `public/ocr/manifest.json` records asset sizes and SHA-256 hashes. The preparation script does not download files.

English data source: https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/eng.traineddata

SHA-256: `7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2`

Upstream: https://github.com/tesseract-ocr/tessdata_fast/tree/4.1.0

All three upstream Apache-2.0 license texts remain in `public/ocr/`.

Searchable PDF output preserves source page dimensions and rendered images, includes every recognized line rather than silently truncating to 80 lines/120 characters, and uses a fully invisible text layer. Selection positions remain approximate. The English text layer uses Helvetica/ASCII; multilingual text and handwriting are not certified. Low-resolution, skewed, multi-column and table scans need separate evaluation.

`tests/e2e/ocr-quality.spec.ts` generates a genuine two-page image-only PDF using canvas text embedded as PNGs, runs actual recognition without mocks/skips, verifies invoice number/amount and repeated sentence in TXT, checks one OCR worker per run, reruns searchable PDF and checks dimensions/embedded text streams, and checks remote requests. Root must execute against a fresh build and append actual results.

Local TypeScript and focused OCR helper/test lint passed before browser execution. This does not establish production readiness or universal OCR accuracy.


2026-10-16 update: the real Chromium quality scenarios described above now PASS in the full 153-test run, with zero skips. Coverage is limited to the asserted fixtures; see QA_REPORT.md for remaining acceptance.
