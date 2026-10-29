# Tool reliability and bandwidth audit — 29 October 2026

## Compression issue and repairs

The old shared PDF validator summed every page's area and rejected documents over 10,000,000 square points. That excludes an ordinary A4 PDF at around 20 pages, even when its file size and per-page memory are small. The separate 50-page cap also rejected long documents. Both gates have been removed from the common PDF path; the analogous native Office output-area/page-count gates were removed too.

- General PDF operations: 100 MB per file. Merge/batch: up to 25 files and 100 MB combined. Compression: 200 MB per file accepted. These are input limits, not proof that every 200 MB document will fit every device's memory.
- PDF renderers cap each live canvas to 8 million pixels and a maximum 4096-pixel edge, rather than adding up document areas.
- Compression defaults to optimizing eligible embedded JPEGs while preserving PDF page boxes, text content and links. Masked, color-managed and other image encodings remain intact. JPEG recompression is lossy.
- Optional Flatten pages creates image-only pages, with physical dimensions independent of pixel resolution. It releases each page/canvas and destroys its PDF worker afterward.
- Results are never larger than the input. Failure to shrink is described as original retained, without claiming that every possible optimizer would fail.
- Office upload UI now displays/enforces its existing 40 MB browser limit consistently. The optional native service still has a separate 20 MB input/output limit.
- Sitemap Generator and Keyword Density Checker were incorrectly marked server-side. Both actually process pasted data locally; runtime metadata and descriptions now reflect this.
- Application-only public DNS configuration fixed the DNS and email lookup tools on this machine. Windows DNS settings were not changed. The actual localhost:3001 DNS endpoint was verified returning 200/success after the configuration change.

## Exact execution counts

These count processing of user input, not delivery of Next.js HTML/JavaScript. Every page still needs hosting, and client tools can send small usage-counter requests without uploading their files.

| Processing | Tools |
| --- | ---: |
| Pure browser processing | 115 |
| Browser default with optional native server conversion | 3 |
| Server-dependent processing | 19 |
| Total | 137 |

Thus **118 client-default tools, 19 server-dependent tools**. The three hybrid tools are Word to PDF, Excel to PDF and PowerPoint to PDF.

Server-dependent tools: AI Detector, Plagiarism Checker, Grammar Checker, Spell Checker, Paraphrasing Tool, Article Rewriter, AI Summarizer, AI Writer, AI Humanizer, AI Translator, AI Email Writer, Website Speed Test, Broken Link Checker, SSL Checker, WHOIS Lookup, DNS Lookup, IP Lookup, Email Validator, Currency Converter.

Full per-tool classification and source hash: [runtime audit](runtime-audit-2026-10-29.json).

## Measured bandwidth

Measured with Chromium against a production next start build, gzip and normal browser caching. Values include response wire bytes/headers. This is a transfer baseline, not a 1,000-concurrent-user load test. Decimal MB/GB are used.

| Journey | Measured per visitor | 1,000 visitors, one journey each |
| --- | ---: | ---: |
| Cold homepage | 0.69 MB | 0.69 GB |
| Cold direct PDF compression, including worker/preview | 1.66 MB | 1.66 GB |
| Homepage followed by compression with shared browser cache | 1.72 MB | 1.72 GB |

PDF input/output stays in the browser for client compression; the measured file-upload traffic is zero. A 20 MB user file does not add 20 MB to server ingress in this path. Repeat visits may transfer less; OCR/HEIC engines, multi-page browsing, provider calls, different CDN compression and cache expiry can add traffic. Raw OCR asset directory size is not a per-visitor wire measurement.

A separate server-file example: 1,000 conversions each uploading 20 MB and downloading 10 MB mean **20 GB ingress + 10 GB client-facing egress**, plus web assets. Hosting plans often meter outgoing transfer differently from incoming transfer. A remote conversion provider can add another outgoing 20 GB upload from this server; an internal private worker has a different network accounting model. AI token charges, CPU/RAM, database traffic and queue capacity are separate. The optional Office route currently permits only two active uploads per process; 1,000 simultaneous server jobs are not certified by this audit.

Raw evidence: [bandwidth baseline](bandwidth-baseline.json).

## Current verification and its limits

- Production build and TypeScript passed.
- Unit suite: **101 passed**, no failures/skips. [Log](unit-audit-2026-10-29.txt).
- Full Chromium suite: **169 passed of 172**, with two timing/browser readiness failures and one obsolete dark-mode control assertion. [Original full-run report](browser-audit-2026-10-29.json).
- Both timing cases passed focused reruns without a product code change. The retired dark-mode assertion was replaced with a keyboard dismissal/navigation check for the current Tools menu. Final targeted recheck: **7 passed**, **0 failed**, **0 skipped**. It also rechecked both compression modes, browser Word conversion and optional server upload transport. [Recheck report](browser-audit-recheck-2026-10-29.json).
- The full run includes all 137 registered tool URLs, independent output assertions, malformed inputs, Office round trips, actual English OCR/HEIC engines and responsive layouts. It is not a clean single-run 172/172 result and does not prove correctness for every input/browser.
- The compression regression uses a 62-page mixed-format PDF, including a large-format page; requires actual JPEG size reduction, unchanged decoded content streams, retained link annotation and exact page geometry. It verifies no non-usage file POST. Flattened portrait/landscape outputs retain physical dimensions.
- Live public network tools: **8/8 passed** with explicit application DNS. [Evidence](network-quality-optin-dns-results.json). The default system DNS run records the original two failures separately.
- Current checkout has no configured AI credentials, Copyleaks credentials, MongoDB connection or native Office service URL. Mocked provider tests and fallback conversions do not certify those live services. No paid AI/plagiarism calls or production database writes were made.

## iLovePDF parity: incomplete

Reference checked: [current iLovePDF tools](https://www.ilovepdf.com/) and [Basic/Premium limits](https://www.ilovepdf.com/pricing). Its Basic compression limit is 200 MB; that is not a claim of equal engine performance or Premium parity.

Our registry contains 22 PDF-category tools and 115 tools in other categories. The total 137 is not a count of PDF features equivalent to iLovePDF.

Missing dedicated capabilities include HTML/URL to PDF, PDF/A, repair, PDF page numbering, scan-to-PDF, crop-PDF, fillable PDF forms, true content redaction, PDF comparison, PDF translation with layout preservation, PDF-to-Markdown and reusable document workflows. Extraction can use Split PDF and reordering uses Rearrange PDF, but combined organization/batch workflows differ. Sign PDF adds a local signature image/text; it does not offer signature requests, identity validation or audit-trail services.

Existing limitations remain explicit: OCR is printed English and limited to 10 pages/three-minute runs; editable PDF-to-Word reconstruction is approximate; PDF-to-PowerPoint uses page images; PDF-to-Excel does not recover original formulas/complex styling; browser PowerPoint-to-PDF rejects unsupported mixed content; background removal uses chroma-key removal and upscaling uses canvas resampling. Native processing infrastructure and dedicated engines are needed for fuller parity. These limitations have not been disguised as successful complete implementations.
