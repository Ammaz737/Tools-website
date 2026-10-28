# Quiet Workshop — Tools Spec & Code Configuration

Single reference for all **137 tools**: what each does, product specs, and how it is wired in code.

> Source of truth for metadata: `lib/tools.ts`  
> Source of truth for UI wiring: `tools/index.tsx` (`ToolDispatcher`)  
> Route for every tool: `/tools/[id]`

---

## 1. Architecture (how tools work in code)

```
lib/tools.ts                  → registry (id, name, category, runtime, blurb, keywords, accepts)
app/tools/[slug]/page.tsx     → loads tool from registry + ToolShell + ToolDispatcher
tools/index.tsx               → switch(tool.id) → concrete React workspace component
tools/{pdf,image,text,...}/   → implementations (often one file per category)
components/ui/ToolShell.tsx   → breadcrumbs, about, how-to, FAQ, related tools
app/api/*                     → server routes for AI / network / rates / admin
```

### Status legend

| Status | Meaning |
|--------|---------|
| **Implemented** | Real workspace in `ToolDispatcher` |
| **Placeholder** | Route + SEO exist; UI is `ToolPlaceholder` until built |
| **Shared component** | Multiple tool IDs reuse one React component with props |

### Runtime

| Runtime | Meaning |
|---------|---------|
| `client` | Processing in the browser; files should not upload |
| `server` | Needs `app/api/*` (AI key, DNS, rates, crawl, etc.) |

---

## 2. Global code configuration

### Key libraries (`package.json`)

| Domain | Packages |
|--------|----------|
| PDF | `pdf-lib`, `@cantoo/pdf-lib` (encrypt/decrypt), `pdfjs-dist`, `jszip`, `tesseract.js` |
| Office | `docx`, `mammoth`, `xlsx`, `pptxgenjs`, `jspdf`, `html2canvas` |
| Image | `browser-image-compression`, Canvas API |
| QR / barcode | `qrcode`, `bwip-js` |
| Hash | `spark-md5`, Web Crypto |
| DB / admin | `mongodb` |

### Shared helpers

| File | Role |
|------|------|
| `lib/pdf-client.ts` | pdf.js load / render / text extract |
| `lib/pdf-ops.ts` | page-range parse, blob URLs, error helpers |
| `lib/office-client.ts` | browser Office ↔ PDF conversions |
| `lib/docx-from-text.ts` | PDF → DOCX builders |
| `lib/server/ai.ts` | AI provider abstraction |
| `components/ui/*` | Dropzone, ResultPanel, Button, ToolShell, … |

### Environment (`.env.example` / `.env.local`)

| Variable | Used for |
|----------|----------|
| `MONGODB_URI`, `MONGODB_DB` | Admin / tool usage stats |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Admin panel auth |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | AI tools |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | AI tools |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | Local AI |
| `AI_PROVIDER` | `auto` / provider pick |
| `OFFICE_CONVERTER_URL`, `LIBREOFFICE_PATH` | Optional future server Office (browser is default) |

### Main API routes

| Route | Purpose |
|-------|---------|
| `POST /api/ai` | AI write / summarize / translate / detect / … |
| `GET /api/rates` | Currency rates (cached) |
| `GET /api/dns`, `/api/whois`, `/api/ssl`, `/api/ip` | Network lookups |
| `GET/POST /api/email-check` | Email MX / validation |
| `GET/POST /api/crawl` | Broken-link / crawl helpers |
| `POST /api/convert-office` | Optional server Office (stub / future) |
| `/api/admin/*`, `/api/tools/*` | Admin + usage tracking |

---

## 3. PDF tools (22) — all **Implemented**

**Code:** `tools/pdf/PdfTools.tsx`, `tools/office/OfficeTools.tsx`, `tools/image/ImageTools.tsx` (jpg/png→pdf)  
**Libs:** `pdf-lib`, `@cantoo/pdf-lib`, `pdfjs-dist`, `jszip`, `tesseract.js`, `docx` / `xlsx` / `pptxgenjs`

| ID | Name | Runtime | What it does | Code config / options |
|----|------|---------|--------------|------------------------|
| `pdf-to-word` | PDF to Word | client | PDF → `.docx` | `OfficeConverterTool` locked `docx`; modes: **exact** (page images) / **editable** (text extract) |
| `word-to-pdf` | Word to PDF | client | DOCX → PDF | Locked target `pdf`; accept `.doc/.docx`; `mammoth` + `jspdf` path via `office-client` |
| `pdf-to-excel` | PDF to Excel | client | PDF text → XLSX | Locked `xlsx`; one sheet per page (text) |
| `excel-to-pdf` | Excel to PDF | client | XLS/XLSX/CSV → PDF | Locked `pdf`; spreadsheet render |
| `pdf-to-powerpoint` | PDF to PowerPoint | client | Each page → slide image | Locked `pptx` |
| `powerpoint-to-pdf` | PowerPoint to PDF | client | PPTX → PDF | Locked `pdf`; slide text render |
| `pdf-to-jpg` | PDF to JPG | client | Pages → JPG | `PdfToImageTool lockedFormat="jpg"`; quality 1×/2×/3×; multi → ZIP |
| `pdf-to-png` | PDF to PNG | client | Pages → PNG | `lockedFormat="png"`; same as above |
| `jpg-to-pdf` | JPG to PDF | client | JPGs → one PDF | `ImageToPdfTool acceptMode="jpg"`; page size fit/A4/Letter |
| `png-to-pdf` | PNG to PDF | client | PNGs → one PDF | `acceptMode="png"` |
| `merge-pdf` | Merge PDF | client | Combine PDFs (reorder) | Dropzone multi + arrows; `pdf-lib` copyPages |
| `split-pdf` | Split PDF | client | Extract range **or** every N → ZIP | Modes: `range` / `every`; `jszip` |
| `compress-pdf` | Compress PDF | client | Re-encode pages as JPEG | Levels high/med/low (scale + quality) |
| `rotate-pdf` | Rotate PDF | client | Rotate all pages | 90 / 180 / 270 |
| `unlock-pdf` | Unlock PDF | client | Strip restrictions with password | `@cantoo/pdf-lib` + password; ownership note |
| `protect-pdf` | Protect PDF | client | Encrypt + restrict | Confirm password; `@cantoo/pdf-lib` encrypt |
| `edit-pdf` | Edit PDF | client | Text overlay / whiteout | Page picker, X/Y/size/color |
| `ocr-pdf` | OCR PDF | client | Scanned PDF → searchable PDF or TXT | `tesseract.js` eng; progress bar |
| `sign-pdf` | Sign PDF | client | Typed or drawn signature | Mode type/draw; page select |
| `watermark-pdf` | Watermark PDF | client | Text watermark | Opacity, size, angle, single/tiled |
| `delete-pdf-pages` | Delete PDF Pages | client | Remove pages by list/range | e.g. `1,3,5-7` |
| `rearrange-pdf-pages` | Rearrange PDF Pages | client | New page order list | Comma order e.g. `3,1,2` |

---

## 4. Image tools (18)

**Code:** `tools/image/ImageTools.tsx`

| ID | Name | Runtime | Status | What it does | Code config |
|----|------|---------|--------|--------------|-------------|
| `image-compressor` | Image Compressor | client | Implemented | Compress JPG/PNG/WebP | `browser-image-compression`; quality slider |
| `image-resizer` | Image Resizer | client | Implemented | Resize by px / % | Canvas |
| `crop-image` | Crop Image | client | Implemented | Crop + aspect presets | Sliders + presets 1:1, 16:9, … |
| `rotate-image` | Rotate Image | client | Implemented | Rotate / flip | Canvas |
| `convert-image` | Convert Image | client | Implemented | Generic convert | `ImageConverterTool targetFormat="png"` (default) |
| `jpg-to-png` | JPG to PNG | client | Implemented | JPG → PNG | Shared `ImageConverterTool` → `png` |
| `png-to-jpg` | PNG to JPG | client | Implemented | PNG → JPG | → `jpg` |
| `webp-converter` | WebP Converter | client | Implemented | ↔ WebP | → `webp` |
| `webp-to-jpg` | WebP to JPG | client | Implemented | WebP → JPG | → `jpg` |
| `webp-to-png` | WebP to PNG | client | Implemented | WebP → PNG | → `png` |
| `jfif-to-png` | JFIF to PNG | client | Implemented | JFIF → PNG | → `png` |
| `jpeg-to-jpg` | JPEG to JPG | client | Implemented | Re-export as JPG | → `jpg` |
| `heic-to-jpg` | HEIC to JPG | client | Implemented* | HEIC → JPG | Same converter path (*browser codec support varies; no `heic2any` dep yet) |
| `svg-converter` | SVG Converter | client | Implemented | SVG → PNG/JPG | `SvgConverterTool` |
| `background-remover` | Background Remover | client | Implemented | Remove bg (color tolerance) | Canvas chroma-style remover (not WASM AI model yet) |
| `image-upscaler` | Image Upscaler | client | Implemented | Upscale + sharpen | Canvas scale (Lanczos-style fallback, not ML) |
| `image-to-pdf` | Image to PDF | client | Implemented | Images → PDF | `ImageToPdfTool acceptMode="both"` |
| `screenshot-tool` | Screenshot Tool | client | Implemented | Capture/upload + annotate | `getDisplayMedia` + canvas |

---

## 5. AI & writing tools (11)

**Code:** `tools/ai/AiTools.tsx` → `POST /api/ai` → `lib/server/ai.ts`  
**Config:** `OPENAI_*` / `GEMINI_*` / `OLLAMA_*` / `AI_PROVIDER`  
**Limit:** prompt max **20,000** chars

| ID | Name | Runtime | Status | What it does | Code config |
|----|------|---------|--------|--------------|-------------|
| `ai-writer` | AI Writer | server | Implemented | Draft from prompt | `AiWriterTool taskType="write"` |
| `ai-email-writer` | AI Email Writer | server | Implemented | Email from bullets | `taskType="email"` |
| `ai-summarizer` | AI Summarizer | server | Implemented | Summarize text | `taskType="summarize"` |
| `paraphrasing-tool` | Paraphrasing Tool | server | Implemented | Paraphrase | `taskType="paraphrase"` |
| `article-rewriter` | Article Rewriter | server | Implemented | Long rewrite | `taskType="rewrite"` |
| `ai-humanizer` | AI Humanizer | server | Implemented | Humanize AI text | `taskType="humanize"` |
| `grammar-checker` | Grammar Checker | server | Implemented | Grammar / style | `AiGrammarTranslatorTool initialMode="grammar"` |
| `spell-checker` | Spell Checker | client* | Implemented | Same UI as grammar | Registry says client; currently shares grammar UI/API |
| `ai-translator` | AI Translator | server | Implemented | Translate | `initialMode="translate"` + `targetLanguage` |
| `ai-detector` | AI Detector | server | Implemented | AI-vs-human score | `AiDetectorTool` |
| `plagiarism-checker` | Plagiarism Checker | server | Implemented | Similarity check | Needs provider; graceful not-configured state |

---

## 6. Text tools (11) — all **Implemented**

**Code:** `tools/text/TextTools.tsx` · Runtime: **client** · Live / instant UX

| ID | Name | What it does | Specs / options |
|----|------|--------------|-----------------|
| `case-converter` | Case Converter | Change casing | UPPER, lower, Title, Sentence, camel, snake, kebab, alternating |
| `word-counter` | Word Counter | Stats | Words, chars, sentences, paragraphs, reading time |
| `character-counter` | Character Counter | Char counts | With/without spaces |
| `sentence-counter` | Sentence Counter | Sentence stats | Count + averages |
| `remove-duplicate-lines` | Remove Duplicate Lines | Dedupe lines | Keep order |
| `text-sorter` | Text Sorter | Sort lines | A→Z, reverse, length, etc. |
| `text-cleaner` | Text Cleaner | Clean messy text | Tags / whitespace toggles |
| `lorem-ipsum-generator` | Lorem Ipsum Generator | Placeholder text | Paragraphs / sentences / words |
| `random-text-generator` | Random Text Generator | Random strings | Length / charset style options |
| `remove-extra-spaces` | Remove Extra Spaces | Collapse spaces | Trim + blank lines |
| `reverse-text` | Reverse Text | Reverse | Whole / words / each word |

---

## 7. Developer tools (19)

**Code:** `tools/developer/DeveloperTools.tsx`

| ID | Name | Runtime | Status | What it does | Code config |
|----|------|---------|--------|--------------|-------------|
| `json-formatter` | JSON Formatter | client | Implemented | Pretty-print JSON | Indent / format |
| `json-validator` | JSON Validator | client | Implemented | Validate + errors | Parse errors surfaced |
| `json-minifier` | JSON Minifier | client | Implemented | Minify JSON | Size savings |
| `xml-formatter` | XML Formatter | client | **Placeholder** | Pretty XML | Not in dispatcher yet |
| `xml-validator` | XML Validator | client | **Placeholder** | Validate XML | — |
| `html-formatter` | HTML Formatter | client | **Placeholder** | Beautify HTML | — |
| `html-minifier` | HTML Minifier | client | **Placeholder** | Minify HTML | — |
| `css-minifier` | CSS Minifier | client | **Placeholder** | Minify CSS | — |
| `javascript-minifier` | JavaScript Minifier | client | **Placeholder** | Minify JS | — |
| `sql-formatter` | SQL Formatter | client | **Placeholder** | Format SQL | — |
| `base64-encoder` | Base64 Encoder | client | Implemented | Text/file → Base64 | `btoa` / FileReader |
| `base64-decoder` | Base64 Decoder | client | Implemented | Base64 → text | — |
| `url-encoder` | URL Encoder | client | Implemented | `encodeURIComponent` | — |
| `url-decoder` | URL Decoder | client | Implemented | Decode URL | — |
| `jwt-decoder` | JWT Decoder | client | Implemented | Decode header/payload | **No verify**; client only |
| `uuid-generator` | UUID Generator | client | Implemented | Bulk UUIDs | `crypto.randomUUID` |
| `hash-generator` | Hash Generator | client | Implemented | MD5/SHA family | Web Crypto + `spark-md5` |
| `md5-generator` | MD5 Generator | client | Implemented | MD5 only | Shared `HashGeneratorTool` |
| `sha256-generator` | SHA-256 Generator | client | Implemented | SHA-256 | Shared `HashGeneratorTool` |

---

## 8. SEO tools (10)

| ID | Name | Runtime | Status | What it does | Code / API |
|----|------|---------|--------|--------------|------------|
| `meta-tag-generator` | Meta Tag Generator | client | **Placeholder** | Title/meta/OG/Twitter | — |
| `robots-txt-generator` | Robots.txt Generator | client | **Placeholder** | Build robots.txt | — |
| `sitemap-generator` | Sitemap Generator | server | **Placeholder** | URL list / crawl sitemap | Future crawl API |
| `keyword-density-checker` | Keyword Density Checker | server | **Placeholder** | n-gram density | — |
| `serp-preview-tool` | SERP Preview Tool | client | **Placeholder** | Google snippet preview | — |
| `open-graph-generator` | Open Graph Generator | client | **Placeholder** | OG card tags | — |
| `canonical-tag-generator` | Canonical Tag Generator | client | **Placeholder** | Canonical link | — |
| `schema-markup-generator` | Schema Markup Generator | client | **Placeholder** | JSON-LD forms | — |
| `website-speed-test` | Website Speed Test | server | Implemented | Timing metrics for URL | `tools/server/ServerTools.tsx` + crawl/timing API |
| `broken-link-checker` | Broken Link Checker | server | Implemented | Find 4xx/5xx links | `/api/crawl` |

---

## 9. Security tools (7)

| ID | Name | Runtime | Status | What it does | Code / API |
|----|------|---------|--------|--------------|------------|
| `password-generator` | Password Generator | client | Implemented | Strong random passwords | Shared with utilities (`PasswordGeneratorTool`) |
| `password-strength-checker` | Password Strength Checker | client | **Placeholder** | Entropy / crack time | Spec: `zxcvbn` (not installed yet) |
| `ssl-checker` | SSL Checker | server | Implemented | Cert issuer / expiry | `GET /api/ssl` |
| `whois-lookup` | WHOIS Lookup | server | Implemented | Domain registration | `GET /api/whois` |
| `dns-lookup` | DNS Lookup | server | Implemented | A/AAAA/MX/TXT/NS/… | `GET /api/dns` |
| `ip-lookup` | IP Lookup | server | Implemented | Geo / ASN | `GET /api/ip` |
| `email-validator` | Email Validator | server | Implemented | Syntax + MX | `/api/email-check` |

---

## 10. Converters (9)

**Code:** `tools/converters/ConverterTools.tsx` + `CurrencyConverterServerTool`

| ID | Name | Runtime | Status | What it does | Code config |
|----|------|---------|--------|--------------|-------------|
| `currency-converter` | Currency Converter | server | Implemented | Live rates + swap | `GET /api/rates` |
| `length-converter` | Length Converter | client | Implemented | m/ft/mi/… | Two-way inputs |
| `weight-converter` | Weight Converter | client | Implemented | kg/lb/oz/… | — |
| `area-converter` | Area Converter | client | **Placeholder** | m²/ft²/acre/… | — |
| `temperature-converter` | Temperature Converter | client | Implemented | C/F/K | — |
| `time-zone-converter` | Time Zone Converter | client | **Placeholder** | Zones + DST | Spec: `luxon` (not installed) |
| `data-storage-converter` | Data Storage Converter | client | **Placeholder** | bit/byte/KB/… | — |
| `binary-converter` | Binary Converter | client | Implemented | text↔bin↔hex↔dec | — |
| `roman-numeral-converter` | Roman Numeral Converter | client | Implemented | Number ↔ Roman | — |

---

## 11. Calculators (15)

**Code:** `tools/calculators/CalculatorTools.tsx`

| ID | Name | Runtime | Status | What it does | Code config |
|----|------|---------|--------|--------------|-------------|
| `age-calculator` | Age Calculator | client | Implemented | Exact age + next birthday | — |
| `bmi-calculator` | BMI Calculator | client | Implemented | Metric/imperial BMI | — |
| `percentage-calculator` | Percentage Calculator | client | Implemented | % of / is what % / change | Modes/tabs |
| `emi-calculator` | EMI Calculator | client | Implemented | EMI from P/R/N | Shared with loan |
| `loan-calculator` | Loan Calculator | client | Implemented | Payment / interest | Same `EmiCalculatorTool` |
| `gst-calculator` | GST Calculator | client | Implemented | Add/remove GST | Shared with VAT |
| `vat-calculator` | VAT Calculator | client | Implemented | Add/remove VAT | Same `GstCalculatorTool` |
| `discount-calculator` | Discount Calculator | client | **Placeholder** | Sale price / savings | — |
| `profit-calculator` | Profit Calculator | client | **Placeholder** | Profit / margin / markup | — |
| `scientific-calculator` | Scientific Calculator | client | **Placeholder** | Full sci calc | — |
| `date-calculator` | Date Calculator | client | **Placeholder** | Diff / add days | — |
| `mortgage-calculator` | Mortgage Calculator | client | **Placeholder** | Mortgage payment | — |
| `roi-calculator` | ROI Calculator | client | **Placeholder** | ROI % | — |
| `tip-calculator` | Tip Calculator | client | **Placeholder** | Tip + split | — |
| `margin-calculator` | Margin Calculator | client | **Placeholder** | Margin/markup solve | — |

---

## 12. Utilities (15)

**Code:** `tools/utilities/UtilityTools.tsx`

| ID | Name | Runtime | Status | What it does | Code config |
|----|------|---------|--------|--------------|-------------|
| `qr-code-generator` | QR Code Generator | client | Implemented | Text/URL → QR | `qrcode` lib; PNG download |
| `barcode-generator` | Barcode Generator | client | Implemented | CODE128 etc. | `bwip-js` |
| `color-picker` | Color Picker | client | Implemented | Pick + copy formats | Shared with color-converter |
| `color-converter` | Color Converter | client | Implemented | HEX/RGB/HSL… | Same `ColorPickerTool` |
| `uuid-generator-util` | UUID Generator (util) | client | Implemented | Friendly UUID UI | Same `UuidGeneratorTool` as developer |
| `random-number-generator` | Random Number Generator | client | **Placeholder** | Range / count / unique | — |
| `random-password-generator` | Random Password Generator | client | Implemented | Utility entry for passwords | Same `PasswordGeneratorTool` |
| `timestamp-converter` | Timestamp Converter | client | **Placeholder** | Date ↔ Unix | — |
| `unix-time-converter` | Unix Time Converter | client | **Placeholder** | Unix → human | — |
| `coin-flipper` | Coin Flipper | client | Implemented | Heads/tails + streak | — |
| `dice-roller` | Dice Roller | client | **Placeholder** | N dice × M sides | — |
| `stopwatch` | Stopwatch | client | **Placeholder** | Laps / ms | — |
| `timer` | Timer | client | **Placeholder** | Countdown + alarm | — |
| `notepad-online` | Notepad Online | client | Implemented | Autosave notes | `localStorage` |
| `todo-list-online` | Todo List Online | client | **Placeholder** | Tasks + localStorage | — |

---

## 13. Implementation summary (as of this doc)

| Category | Total | Implemented | Placeholder |
|----------|------:|------------:|------------:|
| PDF | 22 | 22 | 0 |
| Image | 18 | 18 | 0 |
| AI | 11 | 11 | 0 |
| Text | 11 | 11 | 0 |
| Developer | 19 | 12 | 7 |
| SEO | 10 | 2 | 8 |
| Security | 7 | 6 | 1 |
| Converters | 9 | 6 | 3 |
| Calculators | 15 | 7 | 8 |
| Utilities | 15 | 9 | 6 |
| **Total** | **137** | **~104** | **~33** |

Counts treat “shared UI wired in dispatcher” as implemented even when some advanced libs from the product spec (e.g. `heic2any`, `@imgly/background-removal`, `zxcvbn`) are not installed yet.

---

## 14. How to add a new tool

1. Add registry entry in `lib/tools.ts` (`id` = route slug).
2. Implement workspace component under `tools/<category>/…`.
3. Wire `case "your-id":` in `tools/index.tsx`.
4. (If server) add/validate `app/api/...` + env vars in `.env.example`.
5. Keep client tools private (no file upload) unless runtime is `server`.

---

## 15. Quick route map

- Home: `/`
- All tools: `/tools`
- Category: `/category/[slug]` (`pdf`, `image`, `ai`, …)
- Tool page: `/tools/[id]` (e.g. `/tools/merge-pdf`)
- Legal / about: `/about`, `/privacy`, `/terms`, …

---

*Generated from `lib/tools.ts` + `tools/index.tsx` + API/env configuration. Update this file when tool status or wiring changes.*
