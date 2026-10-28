# Audit Results — Quiet Workshop Tools

> Resume note (2026-10-11): preserve this historical audit. The generated `full`/`done` labels below are static estimates, not functional PASS evidence. Current inventory and verification are tracked in `docs/tool-inventory.md`, `docs/tool-test-matrix.json`, and `docs/tool-test-results.md`. Admin authentication remediation and login/AI throttling are recorded in `docs/security-audit.md`.

Generated: 2026-08-10
Total tools: **137**
Wired in dispatcher: **103**

## Summary by category

| Category | Total | Full | Degraded | Placeholder |
|----------|------:|-----:|---------:|------------:|
| pdf | 22 | 18 | 4 | 0 |
| image | 18 | 15 | 3 | 0 |
| ai | 11 | 9 | 2 | 0 |
| text | 11 | 11 | 0 | 0 |
| developer | 19 | 12 | 0 | 7 |
| seo | 10 | 2 | 0 | 8 |
| security | 7 | 6 | 0 | 1 |
| converters | 9 | 6 | 0 | 3 |
| calculators | 15 | 7 | 0 | 8 |
| utilities | 15 | 8 | 0 | 7 |
| **ALL** | **137** | **94** | **9** | **34** |

## Shared components map

| Component | Tool IDs |
|-----------|----------|
| `OfficeConverterTool` | pdf-to-word, word-to-pdf, pdf-to-excel, excel-to-pdf, pdf-to-powerpoint, powerpoint-to-pdf |
| `PdfToImageTool` | pdf-to-jpg, pdf-to-png |
| `ImageToPdfTool` | jpg-to-pdf, png-to-pdf, image-to-pdf |
| `ImageConverterTool` | convert-image, jpg-to-png, png-to-jpg, webp-*, jfif-to-png, jpeg-to-jpg, heic-to-jpg |
| `AiWriterTool` | ai-writer, ai-email-writer, ai-summarizer, paraphrasing-tool, article-rewriter, ai-humanizer |
| `AiGrammarTranslatorTool` | grammar-checker, spell-checker, ai-translator |
| `HashGeneratorTool` | hash-generator, md5-generator, sha256-generator |
| `EmiCalculatorTool` | emi-calculator, loan-calculator |
| `GstCalculatorTool` | gst-calculator, vat-calculator |
| `PasswordGeneratorTool` | password-generator, random-password-generator |
| `ColorPickerTool` | color-picker, color-converter |
| `UuidGeneratorTool` | uuid-generator, uuid-generator-util |

## P0 / P1 backlog (seed + deep audit)

| Sev | Tool | Issue | Fix type | Status |
|-----|------|-------|----------|--------|
| P0 | word-to-pdf / pdf-to-word | Formatting clip/shift; fidelity UI | harden | **fixed** (40MB/80-page caps, badges, editable warning + OCR link) |
| P0 | powerpoint-to-pdf | Text-only slides | label | **fixed** (honest help + result badge) |
| P0 | heic-to-jpg | No heic2any | label / lib-install | **partial** (warn + onerror; lib still open) |
| P0 | background-remover | Chroma only | label | **fixed** |
| P0 | image-upscaler | Canvas ≠ AI | label | **fixed** |
| P0 | AI writers | Fake local drafts | bugfix | **fixed** (provider required) |
| P0 | ai-detector | No score from API | bugfix | **fixed** (JSON score parse) |
| P0 | plagiarism-checker | Fake uniqueness % | bugfix | **fixed** (blocked; no invent) |
| P1 | compress-pdf | Destroys selectable text | label | **labeled** |
| P1 | spell-checker | Runtime wrong | bugfix | **fixed** (→ server) |
| P1 | All AI tools | No 20k UI meter | harden | **fixed** |
| P1 | All /api/* | No rate limiting | server | open |
| P2 | ~34 placeholders | Not wired | implement | open |

## Deep notes (A1–A3) — completed 2026-08-10

### A1 PDF / Office
- Structural PDF tools wired in `PdfTools.tsx` with privacy notes.
- Word→PDF: `docx-preview` + html2canvas; hardened size/page guards.
- PDF→Word: default exact; editable warns + links OCR.
- PPTX→PDF: text extract — labeled degraded.
- PDF→PPTX: page images. PDF→Excel: text approx.

### A2 Image
- HEIC degraded until `heic2any`. Bg-remove / upscaler disclaimers added.

### A3 AI
- Provider required; plagiarism blocked; detector returns score; 20k CharMeter; spell runtime fixed.

### Remaining next
1. `heic2any` / `zxcvbn` / `luxon` installs  
2. `/api/*` rate limits  
3. Implement placeholders (F3)  
4. LibreOffice hybrid (decision)

## pdf

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `pdf-to-word` | PDF to Word | client | yes | full | dispatcher | — | — | done |
| `word-to-pdf` | Word to PDF | client | yes | full | dispatcher | — | — | done |
| `pdf-to-excel` | PDF to Excel | client | yes | degraded | dispatcher | See P0/P1 backlog | label / harden / lib-install | done |
| `excel-to-pdf` | Excel to PDF | client | yes | full | dispatcher | — | — | done |
| `pdf-to-powerpoint` | PDF to PowerPoint | client | yes | degraded | dispatcher | See P0/P1 backlog | label / harden / lib-install | done |
| `powerpoint-to-pdf` | PowerPoint to PDF | client | yes | degraded | dispatcher | See P0/P1 backlog | label / harden / lib-install | done |
| `pdf-to-jpg` | PDF to JPG | client | yes | full | dispatcher | — | — | done |
| `jpg-to-pdf` | JPG to PDF | client | yes | full | dispatcher | — | — | done |
| `png-to-pdf` | PNG to PDF | client | yes | full | dispatcher | — | — | done |
| `pdf-to-png` | PDF to PNG | client | yes | full | dispatcher | — | — | done |
| `merge-pdf` | Merge PDF | client | yes | full | dispatcher | — | — | done |
| `split-pdf` | Split PDF | client | yes | full | dispatcher | — | — | done |
| `compress-pdf` | Compress PDF | client | yes | degraded | dispatcher | See P0/P1 backlog | label / harden / lib-install | done |
| `rotate-pdf` | Rotate PDF | client | yes | full | dispatcher | — | — | done |
| `unlock-pdf` | Unlock PDF | client | yes | full | dispatcher | — | — | done |
| `protect-pdf` | Protect PDF | client | yes | full | dispatcher | — | — | done |
| `edit-pdf` | Edit PDF | client | yes | full | dispatcher | — | — | done |
| `ocr-pdf` | OCR PDF | client | yes | full | dispatcher | — | — | done |
| `sign-pdf` | Sign PDF | client | yes | full | dispatcher | — | — | done |
| `watermark-pdf` | Watermark PDF | client | yes | full | dispatcher | — | — | done |
| `delete-pdf-pages` | Delete PDF Pages | client | yes | full | dispatcher | — | — | done |
| `rearrange-pdf-pages` | Rearrange PDF Pages | client | yes | full | dispatcher | — | — | done |

## image

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `image-compressor` | Image Compressor | client | yes | full | dispatcher | — | — | done |
| `image-resizer` | Image Resizer | client | yes | full | dispatcher | — | — | done |
| `crop-image` | Crop Image | client | yes | full | dispatcher | — | — | done |
| `rotate-image` | Rotate Image | client | yes | full | dispatcher | — | — | done |
| `convert-image` | Convert Image | client | yes | full | dispatcher | — | — | done |
| `jpg-to-png` | JPG to PNG | client | yes | full | dispatcher | — | — | done |
| `png-to-jpg` | PNG to JPG | client | yes | full | dispatcher | — | — | done |
| `webp-converter` | WebP Converter | client | yes | full | dispatcher | — | — | done |
| `webp-to-jpg` | WebP to JPG | client | yes | full | dispatcher | — | — | done |
| `webp-to-png` | WebP to PNG | client | yes | full | dispatcher | — | — | done |
| `jfif-to-png` | JFIF to PNG | client | yes | full | dispatcher | — | — | done |
| `jpeg-to-jpg` | JPEG to JPG | client | yes | full | dispatcher | — | — | done |
| `heic-to-jpg` | HEIC to JPG | client | yes | degraded | dispatcher | See P0/P1 backlog | label / harden / lib-install | done |
| `svg-converter` | SVG Converter | client | yes | full | dispatcher | — | — | done |
| `background-remover` | Background Remover | client | yes | degraded | dispatcher | See P0/P1 backlog | label / harden / lib-install | done |
| `image-upscaler` | Image Upscaler | client | yes | degraded | dispatcher | See P0/P1 backlog | label / harden / lib-install | done |
| `image-to-pdf` | Image to PDF | client | yes | full | dispatcher | — | — | done |
| `screenshot-tool` | Screenshot Tool | client | yes | full | dispatcher | — | — | done |

## ai

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `ai-detector` | AI Detector | server | yes | full | dispatcher | — | — | done |
| `plagiarism-checker` | Plagiarism Checker | server | yes | degraded | dispatcher | See P0/P1 backlog | label / harden / lib-install | done |
| `grammar-checker` | Grammar Checker | server | yes | full | dispatcher | — | — | done |
| `spell-checker` | Spell Checker | client | yes | degraded | dispatcher | See P0/P1 backlog | label / harden / lib-install | done |
| `paraphrasing-tool` | Paraphrasing Tool | server | yes | full | dispatcher | — | — | done |
| `article-rewriter` | Article Rewriter | server | yes | full | dispatcher | — | — | done |
| `ai-summarizer` | AI Summarizer | server | yes | full | dispatcher | — | — | done |
| `ai-writer` | AI Writer | server | yes | full | dispatcher | — | — | done |
| `ai-humanizer` | AI Humanizer | server | yes | full | dispatcher | — | — | done |
| `ai-translator` | AI Translator | server | yes | full | dispatcher | — | — | done |
| `ai-email-writer` | AI Email Writer | server | yes | full | dispatcher | — | — | done |

## text

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `case-converter` | Case Converter | client | yes | full | dispatcher | — | — | done |
| `word-counter` | Word Counter | client | yes | full | dispatcher | — | — | done |
| `character-counter` | Character Counter | client | yes | full | dispatcher | — | — | done |
| `sentence-counter` | Sentence Counter | client | yes | full | dispatcher | — | — | done |
| `remove-duplicate-lines` | Remove Duplicate Lines | client | yes | full | dispatcher | — | — | done |
| `text-sorter` | Text Sorter | client | yes | full | dispatcher | — | — | done |
| `text-cleaner` | Text Cleaner | client | yes | full | dispatcher | — | — | done |
| `lorem-ipsum-generator` | Lorem Ipsum Generator | client | yes | full | dispatcher | — | — | done |
| `random-text-generator` | Random Text Generator | client | yes | full | dispatcher | — | — | done |
| `remove-extra-spaces` | Remove Extra Spaces | client | yes | full | dispatcher | — | — | done |
| `reverse-text` | Reverse Text | client | yes | full | dispatcher | — | — | done |

## developer

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `json-formatter` | JSON Formatter | client | yes | full | dispatcher | — | — | done |
| `json-validator` | JSON Validator | client | yes | full | dispatcher | — | — | done |
| `json-minifier` | JSON Minifier | client | yes | full | dispatcher | — | — | done |
| `xml-formatter` | XML Formatter | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `xml-validator` | XML Validator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `html-formatter` | HTML Formatter | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `html-minifier` | HTML Minifier | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `css-minifier` | CSS Minifier | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `javascript-minifier` | JavaScript Minifier | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `sql-formatter` | SQL Formatter | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `base64-encoder` | Base64 Encoder | client | yes | full | dispatcher | — | — | done |
| `base64-decoder` | Base64 Decoder | client | yes | full | dispatcher | — | — | done |
| `url-encoder` | URL Encoder | client | yes | full | dispatcher | — | — | done |
| `url-decoder` | URL Decoder | client | yes | full | dispatcher | — | — | done |
| `jwt-decoder` | JWT Decoder | client | yes | full | dispatcher | — | — | done |
| `uuid-generator` | UUID Generator | client | yes | full | dispatcher | — | — | done |
| `hash-generator` | Hash Generator | client | yes | full | dispatcher | — | — | done |
| `md5-generator` | MD5 Generator | client | yes | full | dispatcher | — | — | done |
| `sha256-generator` | SHA-256 Generator | client | yes | full | dispatcher | — | — | done |

## seo

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `meta-tag-generator` | Meta Tag Generator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `robots-txt-generator` | Robots.txt Generator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `sitemap-generator` | Sitemap Generator | server | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `keyword-density-checker` | Keyword Density Checker | server | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `serp-preview-tool` | SERP Preview Tool | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `open-graph-generator` | Open Graph Generator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `canonical-tag-generator` | Canonical Tag Generator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `schema-markup-generator` | Schema Markup Generator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `website-speed-test` | Website Speed Test | server | yes | full | dispatcher | — | — | done |
| `broken-link-checker` | Broken Link Checker | server | yes | full | dispatcher | — | — | done |

## security

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `password-generator` | Password Generator | client | yes | full | dispatcher | — | — | done |
| `password-strength-checker` | Password Strength Checker | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `ssl-checker` | SSL Checker | server | yes | full | dispatcher | — | — | done |
| `whois-lookup` | WHOIS Lookup | server | yes | full | dispatcher | — | — | done |
| `dns-lookup` | DNS Lookup | server | yes | full | dispatcher | — | — | done |
| `ip-lookup` | IP Lookup | server | yes | full | dispatcher | — | — | done |
| `email-validator` | Email Validator | server | yes | full | dispatcher | — | — | done |

## converters

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `currency-converter` | Currency Converter | server | yes | full | dispatcher | — | — | done |
| `length-converter` | Length Converter | client | yes | full | dispatcher | — | — | done |
| `weight-converter` | Weight Converter | client | yes | full | dispatcher | — | — | done |
| `area-converter` | Area Converter | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `temperature-converter` | Temperature Converter | client | yes | full | dispatcher | — | — | done |
| `time-zone-converter` | Time Zone Converter | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `data-storage-converter` | Data Storage Converter | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `binary-converter` | Binary Converter | client | yes | full | dispatcher | — | — | done |
| `roman-numeral-converter` | Roman Numeral Converter | client | yes | full | dispatcher | — | — | done |

## calculators

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `age-calculator` | Age Calculator | client | yes | full | dispatcher | — | — | done |
| `bmi-calculator` | BMI Calculator | client | yes | full | dispatcher | — | — | done |
| `percentage-calculator` | Percentage Calculator | client | yes | full | dispatcher | — | — | done |
| `emi-calculator` | EMI Calculator | client | yes | full | dispatcher | — | — | done |
| `loan-calculator` | Loan Calculator | client | yes | full | dispatcher | — | — | done |
| `gst-calculator` | GST Calculator | client | yes | full | dispatcher | — | — | done |
| `vat-calculator` | VAT Calculator | client | yes | full | dispatcher | — | — | done |
| `discount-calculator` | Discount Calculator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `profit-calculator` | Profit Calculator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `scientific-calculator` | Scientific Calculator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `date-calculator` | Date Calculator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `mortgage-calculator` | Mortgage Calculator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `roi-calculator` | ROI Calculator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `tip-calculator` | Tip Calculator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `margin-calculator` | Margin Calculator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |

## utilities

| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |
|----|------|---------|:-----:|----------|------|--------|-----|-------|
| `qr-code-generator` | QR Code Generator | client | yes | full | dispatcher | — | — | done |
| `barcode-generator` | Barcode Generator | client | yes | full | dispatcher | — | — | done |
| `color-picker` | Color Picker | client | yes | full | dispatcher | — | — | done |
| `color-converter` | Color Converter | client | yes | full | dispatcher | — | — | done |
| `uuid-generator-util` | UUID Generator | client | yes | full | dispatcher | — | — | done |
| `random-number-generator` | Random Number Generator | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `random-password-generator` | Random Password Generator | client | yes | full | dispatcher | — | — | done |
| `timestamp-converter` | Timestamp Converter | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `unix-time-converter` | Unix Time Converter | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `coin-flipper` | Coin Flipper | client | yes | full | dispatcher | — | — | done |
| `dice-roller` | Dice Roller | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `stopwatch` | Stopwatch | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `timer` | Timer | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
| `notepad-online` | Notepad Online | client | yes | full | dispatcher | — | — | done |
| `todo-list-online` | Todo List Online | client | no | placeholder | ToolPlaceholder | Not implemented | implement | done |
