# CLAUDE.md — Toolbox Web App Build Spec

This file is the single source of truth for building a **137‑tool online workspace** (PDF, image, AI, text, developer, SEO, security, converters, calculators, utilities). It is written for an AI coding agent (Antigravity / Claude Code / Cursor). Follow it top to bottom. Do not copy any existing site's visual design — the design system defined here is **intentionally different** and must be respected.

> Reference site (for feature scope ONLY, not for design): a 137‑tool "premium toolbox". We reuse the *tool list and functionality*, but ship an original UI.

---

## 1. Project Overview

**Goal:** A fast, private, no‑signup web app hosting 137 utilities across 10 categories. Every tool is a self‑contained page. Most tools run **100% client‑side** (in the browser) for privacy and speed. A small set that genuinely need a server (AI, network lookups, heavy conversions) use API routes.

**Non‑negotiable principles**
- **Privacy first.** Client‑side processing wherever technically possible. Never upload a file to a server if it can be processed in the browser. Say so in the UI.
- **No login, no watermark, no paywall.** All tools free.
- **Instant.** First paint fast; tools usable within 1s of page load. Lazy‑load heavy libraries (pdf‑lib, tesseract, ffmpeg, etc.) only when the tool actually runs.
- **Mobile‑first.** Every tool must work on a 360px screen.
- **Accessible.** Keyboard usable, ARIA labels, visible focus rings, prefers‑reduced‑motion respected.
- **SEO.** Each tool = its own indexable route with unique title/description/OG tags + JSON‑LD.

---

## 2. Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript (strict).
- **Styling:** Tailwind CSS v4 + CSS variables for tokens. No component-UI kit dependency for look; build our own primitives. `shadcn/ui` allowed ONLY as unstyled/headless base (Radix) — restyle to match our tokens.
- **State:** React hooks + `zustand` for cross‑component tool state where needed. No global store bloat.
- **Icons:** `lucide-react`.
- **Client storage:** `localStorage` (notepad, todo, recent tools, theme). Wrap in a safe helper (guard for SSR + quota errors).
- **Server (only where required):** Next.js Route Handlers (`app/api/*`). AI tools proxy to a model provider; network tools do server‑side fetch/DNS.
- **Testing:** Vitest + React Testing Library for tool logic; Playwright smoke test that every route renders.
- **Lint/format:** ESLint + Prettier. Commit hooks with Husky + lint‑staged.

**Key libraries by domain** (install lazily / per‑route):
- PDF: `pdf-lib` (create/merge/split/rotate/watermark/protect/delete/reorder), `pdfjs-dist` (render to canvas for preview + PDF→image + text extraction), `tesseract.js` (OCR).
- Office conversions: server side — `libreoffice` headless via a small worker OR a hosted conversion API. If no server budget, mark these as "server" and stub with a documented API contract (see §9).
- Images: native Canvas API + `browser-image-compression`, `heic2any` (HEIC), `utif`/`UPNG` where needed, `@imgly/background-removal` (client WASM background remover), `upscaler` / on‑device model for upscaling.
- Barcodes/QR: `qrcode` + `bwip-js`.
- Code/text: `prettier` standalone (HTML/CSS/JS/SQL formatting), `sql-formatter`, `js-beautify`, `terser` (JS minify), `csso` (CSS minify), `html-minifier-terser`, `fast-xml-parser`.
- Hash/crypto: Web Crypto API (`crypto.subtle`) for SHA; `spark-md5` for MD5; `jsrsasign` or manual base64url for JWT decode (decode only, never verify secrets client‑side).
- Currency/timezone: currency via a rates API (cached); timezone via `Intl` + `luxon`.

If a library can't run in the browser, the tool becomes a documented server route — never silently break.

---

## 3. Design System (THE DIFFERENT UI)

Deliberately distinct from the reference site's dark‑navy "glassy premium" look. Our identity: **"Warm editorial workshop"** — a light, paper‑like canvas, confident typographic hierarchy, one strong accent, crisp bordered cards, subtle grain, and a monospace voice for anything "computed". Feels like a well‑made print magazine crossed with a developer tool.

### 3.1 Color tokens (CSS variables, defined in `app/globals.css`)

Light (default):
```
--bg:            #F7F4EC;  /* warm paper */
--surface:       #FFFFFF;  /* cards */
--surface-sunk:  #F1ECE0;  /* insets, code blocks */
--ink:           #1B1A17;  /* primary text, near‑black warm */
--ink-soft:      #55514A;  /* secondary text */
--ink-faint:     #8A857B;  /* tertiary/labels */
--line:          #E3DCCB;  /* hairline borders */
--line-strong:   #CFC6B2;
--accent:        #E4572E;  /* burnt orange — the signature */
--accent-ink:    #FFFFFF;
--accent-soft:   #FBE7DE;  /* accent tint bg */
--success:       #2F855A;
--warn:          #B7791F;
--danger:        #C53030;
--focus:         #1D4ED8;  /* focus ring, high contrast */
```
Dark (`.dark` on <html>):
```
--bg:            #14130F;
--surface:       #1D1B16;
--surface-sunk:  #262319;
--ink:           #F4EFE4;
--ink-soft:      #C4BEB0;
--ink-faint:     #8F897B;
--line:          #33301F;   /* keep warm */
--line-strong:   #4A4630;
--accent:        #FF6B3D;
--accent-soft:   #3A241A;
```
Theme is user‑toggle + respects `prefers-color-scheme` on first visit. Persist to localStorage.

### 3.2 Typography
- **Display / headings:** a distinctive serif — `"Fraunces"` (variable, optical size). Big, tight leading, slightly high contrast. This is the main differentiator from the reference site's sans‑only look.
- **Body / UI:** `"Inter"` (or `"Geist Sans"`).
- **Mono (all computed output, code, numbers, results):** `"JetBrains Mono"` (or `"Geist Mono"`).
- Scale (fluid, `clamp`): display 40–64px, h1 32–44, h2 24–30, h3 20, body 16, small 14, mono‑result 15.
- Numbers in calculators/converters render in mono, tabular‑nums.

### 3.3 Shape, depth, texture
- **Radius:** cards 14px, inputs/buttons 10px, pills 999px.
- **Borders over shadows.** 1px `--line` borders are the primary separation device. Shadows are rare and soft (`0 1px 0 rgba(0,0,0,.03), 0 8px 24px -16px rgba(0,0,0,.18)`), used only on floating elements (dropdowns, dialogs, sticky action bar).
- **Signature detail:** a faint paper grain overlay on `--bg` (an inline SVG/noise at ~3% opacity, disabled in dark and under reduced‑motion). Category accent stripe (4px) on the left of tool cards.
- **Accent usage:** exactly one accent per view — primary action buttons, active states, links‑on‑hover, category dots. Never flood with orange.

### 3.4 Motion
- 150–200ms ease‑out for hovers; 250ms for enters. Springy only on the drag‑reorder handles.
- Respect `prefers-reduced-motion: reduce` → disable transforms, keep opacity.

### 3.5 Core components (build these first, in `components/ui/`)
- `Button` (variants: primary/solid‑accent, secondary/outline, ghost, danger; sizes sm/md/lg; loading state with spinner).
- `IconButton`, `Input`, `Textarea`, `Select`, `Toggle/Switch`, `Slider`, `Checkbox`, `RadioGroup`, `Tabs`, `Tooltip`, `Dialog`, `Dropdown`, `Toast` (use `sonner` or custom), `Badge`/`Pill`, `Card`, `Breadcrumbs`, `CopyButton` (copies + shows "Copied" state), `EmptyState`, `Spinner`, `ProgressBar`.
- `Dropzone` — the shared file‑input surface: drag‑over highlight, click‑to‑browse, paste‑to‑upload, multi‑file, accepted‑types hint, size limit, file chips with remove, reorder (dnd) where relevant. Emits `File[]`.
- `ResultPanel` — standard output area: header with tool name + "Live/Done" pill, body (text mono / preview / download), footer actions (Download, Copy, Clear, Reset).
- `ToolShell` — the wrapper every tool page uses (see §6.4).

---

## 4. Information Architecture & Routes

```
/                         Home
/tools                    All tools grid + category filter + search
/category/[slug]          One category's tools
/tools/[slug]             A single tool (the workhorse page)
/about /contact /blog     Static/marketing
/privacy /terms /disclaimer /dmca   Legal
/search                   (optional) full tool search results
```

- `[slug]` values are the tool `id`s from §8 (kebab‑case, must match reference paths so links/SEO carry over, e.g. `merge-pdf`, `json-formatter`).
- 404 page must suggest the search + popular tools.
- Generate `sitemap.xml` and `robots.txt` from the tool registry at build time.

**Central registry** — `lib/tools.ts` exports a typed array. This drives navigation, listing pages, search, related tools, sitemap, and per‑tool metadata. Shape:
```ts
type Category = 'pdf'|'image'|'ai'|'text'|'developer'|'seo'|'security'|'converters'|'calculators'|'utilities';
type Runtime = 'client' | 'server';
interface Tool {
  id: string;            // route slug, e.g. 'merge-pdf'
  name: string;          // 'Merge PDF'
  category: Category;
  blurb: string;         // one‑line description
  runtime: Runtime;      // where processing happens
  keywords: string[];    // for search
  accepts?: string[];    // mime/exts for file tools
  featured?: boolean;
  new?: boolean;
}
```
Every tool page imports the registry to render breadcrumbs, title, related tools (same category), and JSON‑LD.

---

## 5. Page Specs

### 5.1 Home (`/`)
Sections, top to bottom:
1. **Hero.** Left‑aligned, editorial. Big Fraunces headline (e.g. "A quiet workshop for 137 small jobs."), one‑line sub, two buttons (Explore all tools → `/tools`; Browse PDF tools → `/category/pdf`). A row of trust chips (No signup · No watermark · Private · Works offline where possible). Right side: a **live mini‑tool** demo card (e.g. a working Word Counter or Case Converter) — proves the product instantly. Different from reference (which used stat counters).
2. **Popular tools** — 12 cards (featured=true).
3. **Categories grid** — 10 cards, each: icon, name, count, blurb, accent stripe. Count derived from registry, not hardcoded.
4. **Featured / hand‑picked** — 6 cards.
5. **Recently added** — 6 cards (new=true).
6. **Why choose us** — 4 value props (Fast / Private / 137 tools / No signup).
7. **FAQ** — accordion (free? private? install? mobile? API?).
8. **Newsletter** — email capture (optional; wire to a form endpoint or Buttondown/ConvertKit; no dark patterns).
9. **Footer** — categories, company, legal, socials.

Ad slots: leave clearly‑labeled `<AdSlot/>` placeholders (home ×1–2, listing ×1, tool page ×2). Component renders nothing unless an ad id is configured. Never let ads shift layout (reserve height).

### 5.2 All tools (`/tools`)
- H1 + count ("137 free tools, 10 categories").
- Sticky filter bar: category chips (All + 10) + a **search input** (fuzzy over name/keywords/blurb, client‑side, e.g. `fuse.js`). Filtering is instant, updates URL query (`?cat=pdf&q=merge`) for shareable/back‑button behavior.
- Responsive card grid (1/2/3/4 cols).
- "Can't find it? Request a tool" → `/contact`.

### 5.3 Category (`/category/[slug]`)
- Category header (name, blurb, count, accent).
- Grid of that category's tools. Cross‑links to sibling categories.

### 5.4 Tool card (shared)
Bordered card, left accent stripe in the category color, tool name (mono‑ish weight), blurb, hover: lift 2px + accent underline on name + "Open tool →". Whole card is a link. Keyboard focusable.

---

## 6. Tool Page Contract (`/tools/[slug]`)

Every tool page is composed from `ToolShell`, so they're consistent and fast to build.

### 6.1 Layout
1. Breadcrumbs: Home / Tools / {Category} / {Tool}.
2. Category badge + H1 (tool name) + one‑line blurb.
3. **The tool workspace** (`ResultPanel` + tool‑specific controls) — the star of the page, above the fold.
4. "About {tool}" — 2–3 sentences + 4 trust bullets (works on every device / no signup / files never leave your device [client tools] / free).
5. "How to use" — 3–4 numbered steps.
6. FAQ — 3–4 items (free? / data safe? / mobile? / how long?).
7. Share row + Related tools (same category, 4).
8. Two ad slots (top, mid) — labeled, reserved height.

### 6.2 Behavior rules (apply to ALL tools)
- Show a clear **input state**, **processing state** (spinner/progress + disabled action), **result state** (with Download/Copy), and **error state** (friendly message, retry). Never leave the user guessing.
- **Client tools:** display a small "Runs locally in your browser — files never uploaded" note. Enforce it (do not send bytes anywhere).
- **File tools:** validate type + size before processing; show human‑readable errors; support multiple files where sensible; allow drag‑reorder where order matters (merge, images→pdf).
- **Text/code tools:** live output as you type (debounced ~200ms) where cheap; big copy button; download as file where relevant; sample/"Load example" button; character/line counts.
- **Downloads:** generate a Blob + object URL, revoke after. Sensible filenames (`merged.pdf`, `resized-1280x720.png`).
- **Reset/Clear** always available.
- Lazy‑import heavy libs inside the action handler (`const { PDFDocument } = await import('pdf-lib')`).
- Never block the main thread on big files — use a Web Worker for OCR, background removal, upscaling, big image batches, ffmpeg‑style work.

### 6.3 Metadata (per tool)
Generate `<title>`, meta description, canonical, OG/Twitter tags from the registry. Add JSON‑LD `SoftwareApplication` (name, description, `applicationCategory`, `offers` price 0) + `BreadcrumbList`.

### 6.4 `ToolShell` API
```tsx
<ToolShell tool={tool}>
  {/* tool‑specific UI: <Dropzone/>, controls, <ResultPanel/> */}
</ToolShell>
```
`ToolShell` renders breadcrumbs, header, About/How/FAQ/Related/Ads from `tool` + optional overrides (custom About copy, custom FAQ, custom steps). Tool authors only build the workspace in the middle.

---

## 7. Category accent colors (for stripes/dots)
```
pdf: #C53030 (red)     image: #2F855A (green)   ai: #6B46C1 (violet)
text: #2B6CB0 (blue)   developer: #1A202C→use accent-ink on dark chip / #2D3748
seo: #B7791F (amber)   security: #4A5568 (slate) converters: #0987A0 (cyan)
calculators: #805AD5 (purple)  utilities: #DD6B20 (orange)
```
Keep the global brand accent (`--accent` burnt orange) for primary actions; category colors only tint stripes, dots, and badges.

---

## 8. THE TOOL REGISTRY (all 137 — spec each)

Format below: **id** — name · runtime · what it does / inputs → outputs / options / lib. Build each as its own page under `/tools/[id]`. `client` = fully in browser; `server` = needs an API route (§9).

### 8.1 PDF Tools (22)
- **pdf-to-word** — PDF → editable .docx. `server`. Input PDF → output DOCX. Preserve text/layout best‑effort. Lib: LibreOffice headless / conversion API.
- **word-to-pdf** — DOC/DOCX → PDF. `server`. Same engine.
- **pdf-to-excel** — extract tables from PDF → XLSX. `server`. Table detection.
- **excel-to-pdf** — XLS/XLSX → PDF. `server`.
- **pdf-to-powerpoint** — PDF → PPTX. `server`.
- **powerpoint-to-pdf** — PPT/PPTX → PDF. `server`.
- **pdf-to-jpg** — each page → JPG (quality slider, DPI select, zip if multi). `client`. `pdfjs-dist` render to canvas → `toBlob('image/jpeg')`; `jszip`.
- **jpg-to-pdf** — JPGs → one PDF (reorderable, page size/orientation/margin options). `client`. `pdf-lib`.
- **png-to-pdf** — PNGs → PDF (as above, keeps transparency→white). `client`. `pdf-lib`.
- **pdf-to-png** — pages → PNG (lossless, DPI). `client`. `pdfjs-dist`.
- **merge-pdf** — combine multiple PDFs, drag‑reorder, per‑file page‑range optional. `client`. `pdf-lib`.
- **split-pdf** — split by ranges / every N pages / extract selected. Output zip. `client`. `pdf-lib`+`jszip`.
- **compress-pdf** — reduce size (quality levels low/med/high; downsample images, drop metadata). `client` (re‑encode via pdf-lib + image recompress) with `server` fallback for aggressive Ghostscript‑level compression.
- **rotate-pdf** — rotate all/selected pages 90/180/270, per‑page thumbnails. `client`. `pdf-lib`.
- **unlock-pdf** — remove open password / permissions (user supplies password). `client` if possible via `pdf-lib`/`qpdf-wasm`; else `server`. Clearly: only for PDFs you own.
- **protect-pdf** — add password + permissions. `client` via `pdf-lib` (encrypt) or `qpdf-wasm`.
- **edit-pdf** — add text, images, shapes, freehand, whiteout on pages; drag/resize; export flattened PDF. `client`. `pdfjs-dist` (render) + `pdf-lib` (write) + a canvas overlay editor. This is the most complex tool — build a small annotation layer with a toolbar (text/image/draw/erase/undo/redo).
- **ocr-pdf** — OCR scanned PDF → searchable PDF (text layer) + optional plain‑text export. `client` (Web Worker). `tesseract.js` per page, overlay invisible text via `pdf-lib`.
- **sign-pdf** — draw/type/upload signature, place on page, export. `client`. Canvas signature pad + `pdf-lib`.
- **watermark-pdf** — text or image watermark; opacity, angle, position, tiling; all/selected pages. `client`. `pdf-lib`.
- **delete-pdf-pages** — thumbnail grid, select pages to remove, export. `client`. `pdfjs-dist`+`pdf-lib`.
- **rearrange-pdf-pages** — thumbnail grid, drag‑reorder, export. `client`. same.

### 8.2 Image Tools (18)
- **image-compressor** — JPG/PNG/WebP lossy+lossless, target quality/size, before/after size. `client`. `browser-image-compression`.
- **image-resizer** — set width/height (lock aspect), % scale, presets. `client`. Canvas.
- **crop-image** — freeform + aspect presets (1:1,4:3,16:9…), rotate, flip. `client`. `react-easy-crop` or custom.
- **rotate-image** — 90/180/270 + arbitrary angle, flip H/V. `client`. Canvas.
- **convert-image** — any↔any among JPG/PNG/WebP/BMP/GIF(first frame)/AVIF(if supported). `client`. Canvas + codecs; AVIF/WebP via `canvas.toBlob`.
- **jpg-to-png** — `client`. Canvas.
- **png-to-jpg** — flatten transparency to chosen bg. `client`. Canvas.
- **webp-converter** — to/from WebP. `client`. Canvas.
- **webp-to-jpg** — `client`. Canvas.
- **webp-to-png** — keep alpha. `client`. Canvas.
- **jfif-to-png** — `client`. Canvas (JFIF is JPEG).
- **jpeg-to-jpg** — re‑encode/rename. `client`. Canvas/passthrough.
- **heic-to-jpg** — iPhone HEIC → JPG (batch, quality). `client`. `heic2any`.
- **svg-converter** — SVG → PNG/JPG at chosen size/scale. `client`. Render SVG to canvas.
- **background-remover** — auto remove bg → transparent PNG. `client` (Web Worker, WASM). `@imgly/background-removal`. Show progress.
- **image-upscaler** — up to 4× AI upscale. `client` (Web Worker, model) or `server` if model too heavy. Fallback: high‑quality Lanczos resize with a clear label.
- **image-to-pdf** — images → PDF (reorder, page setup). `client`. `pdf-lib`.
- **screenshot-tool** — capture (via `getDisplayMedia`) or upload, then annotate (crop, arrows, text, blur, highlight), export PNG. `client`. Canvas editor.

### 8.3 AI & Writing (11) — mostly `server` via model API (§9)
- **ai-detector** — score text as AI vs human, per‑sentence highlight, confidence. `server`. Model/classifier. Be honest about limitations in UI.
- **plagiarism-checker** — compare text against web; return matched sources + %. `server`. Needs a search/plagiarism API. If none, ship as "similarity within your own documents" or clearly mark as requiring an API key.
- **grammar-checker** — grammar/punctuation/style fixes with inline suggestions, accept/reject. `server` (LanguageTool API self‑host or model) — `client` fallback via LanguageTool WASM if feasible.
- **spell-checker** — spelling only, highlight + suggestions. `client` possible with `nspell`+dictionaries; else `server`.
- **paraphrasing-tool** — rewrite text, tone modes (standard/formal/fluent/creative). `server`. Model.
- **article-rewriter** — rewrite long article, keep meaning. `server`. Model (chunked).
- **ai-summarizer** — long text → bullet/paragraph summary, length control. `server`. Model.
- **ai-writer** — generate blog/copy from prompt + options (tone, length, format). `server`. Model.
- **ai-humanizer** — make AI text read natural. `server`. Model.
- **ai-translator** — translate to 100+ languages, auto‑detect source. `server`. Model or translation API.
- **ai-email-writer** — draft emails from bullet points (tone, length, formality). `server`. Model.

**AI UX standard:** textarea in, streamed output, copy/download, regenerate, tone/length controls, character limits with counter, graceful rate‑limit + error messages, and a visible "AI can make mistakes" note. Stream tokens where the provider supports it.

### 8.4 Text Tools (11) — all `client`, instant
- **case-converter** — UPPER/lower/Title/Sentence/camelCase/snake_case/kebab/aLtErNaTiNg. Live. Copy.
- **word-counter** — words, chars, sentences, paragraphs, reading time, keyword density. Live.
- **character-counter** — chars with/without spaces, byte size, live limit meter (for tweets etc.).
- **sentence-counter** — sentence + word + avg length.
- **remove-duplicate-lines** — dedupe, options: trim, case‑insensitive, keep order/sort.
- **text-sorter** — sort lines A→Z / Z→A / numeric / length / reverse / shuffle; case toggle.
- **text-cleaner** — strip HTML tags, extra whitespace, line breaks, non‑ASCII, emojis (toggles).
- **lorem-ipsum-generator** — N paragraphs/sentences/words; start with "Lorem ipsum" toggle.
- **random-text-generator** — random words/strings, length + charset options.
- **remove-extra-spaces** — collapse multiple spaces, trim lines, remove blank lines.
- **reverse-text** — reverse whole string / words order / each word.

### 8.5 Developer Tools (19) — all `client`
- **json-formatter** — pretty print, indent select, sort keys, collapsible tree view, error line highlight.
- **json-validator** — validate + precise error location; show parsed type summary.
- **json-minifier** — minify; byte savings.
- **xml-formatter** — pretty print XML. `fast-xml-parser` / `vkbeautify`.
- **xml-validator** — well‑formedness + errors.
- **html-formatter** — beautify HTML. `js-beautify`/`prettier`.
- **html-minifier** — `html-minifier-terser`.
- **css-minifier** — `csso`.
- **javascript-minifier** — `terser`.
- **sql-formatter** — dialect select. `sql-formatter`.
- **base64-encoder** — text/file → Base64 (+ data URL option). `btoa`/FileReader.
- **base64-decoder** — Base64 → text/file download.
- **url-encoder** — `encodeURIComponent` (component vs full toggle).
- **url-decoder** — decode.
- **jwt-decoder** — decode header+payload, show claims, exp countdown; DO NOT verify/keep secrets. Client only.
- **uuid-generator** — v4 (and v1/v7 optional), bulk count, uppercase/hyphen toggles.
- **hash-generator** — MD5/SHA‑1/SHA‑256/SHA‑512 of text or file. Web Crypto + `spark-md5`.
- **md5-generator** — MD5 of text/file.
- **sha256-generator** — SHA‑256 of text/file. Web Crypto.

For all code tools: two‑pane (input/output), sample loader, copy, download, error surface, monospace font, optional line numbers.

### 8.6 SEO Tools (10)
- **meta-tag-generator** — form → `<title>/<meta>` + OG + Twitter; live preview + copy. `client`.
- **robots-txt-generator** — build robots.txt via allow/disallow rules, sitemap URL. `client`.
- **sitemap-generator** — from a list of URLs OR crawl a site. List mode `client`; crawl mode `server` (fetch + parse links, respect depth/limit).
- **keyword-density-checker** — paste text/URL → 1/2/3‑gram density table. Text `client`; URL fetch `server`.
- **serp-preview-tool** — live Google desktop/mobile snippet preview (title, url, description, pixel‑width truncation). `client`.
- **open-graph-generator** — OG/Twitter tags + live social card preview. `client`.
- **canonical-tag-generator** — build canonical link tag. `client`.
- **schema-markup-generator** — JSON‑LD for Article/Product/FAQ/LocalBusiness/Breadcrumb via forms. `client`.
- **website-speed-test** — run against a URL: load time, size, requests, Core Web Vitals estimate. `server` (fetch + timing) or proxy PageSpeed Insights API.
- **broken-link-checker** — crawl a page, list 4xx/5xx links. `server` (fetch + HEAD/GET, concurrency‑limited).

### 8.7 Security Tools (7)
- **password-generator** — length slider, char classes, exclude ambiguous, strength meter, bulk. `client`. `crypto.getRandomValues`.
- **password-strength-checker** — entropy + crack‑time estimate + feedback. `client`. `zxcvbn`.
- **ssl-checker** — cert issuer, validity, chain, expiry for a domain. `server` (TLS socket / API).
- **whois-lookup** — domain registration info. `server` (WHOIS/RDAP).
- **dns-lookup** — A/AAAA/MX/TXT/NS/CNAME records. `server` (DNS resolver / DoH).
- **ip-lookup** — geolocation + ASN + reverse DNS for an IP. `server` (IP API).
- **email-validator** — syntax + MX + disposable/role detection (bulk). Syntax `client`; MX `server`.

### 8.8 Converters (9) — `client` except live rates
- **currency-converter** — 150+ currencies, live rates, swap, historical optional. Rates via `server`/cached API; math `client`.
- **length-converter** — m/ft/mi/km/in/cm/... `client`.
- **weight-converter** — kg/lb/oz/g/t/... `client`.
- **area-converter** — m²/ft²/acre/ha/... `client`.
- **temperature-converter** — C/F/K. `client`.
- **time-zone-converter** — convert time across zones, DST‑aware. `client`. `luxon`.
- **data-storage-converter** — bit/byte/KB/MB/GB/TB (binary+decimal). `client`.
- **binary-converter** — text↔binary↔hex↔decimal. `client`.
- **roman-numeral-converter** — number↔Roman. `client`.

Converter UX: two inputs bound both ways + a unit picker each + a common‑conversions table below.

### 8.9 Calculators (15) — all `client`
- **age-calculator** — exact y/m/d + total days/hours; next birthday.
- **bmi-calculator** — metric/imperial, category, healthy‑range.
- **percentage-calculator** — X% of Y, X is what % of Y, % change (multiple modes/tabs).
- **emi-calculator** — principal/rate/tenure → EMI + amortization schedule + chart.
- **loan-calculator** — payment, total interest, schedule.
- **gst-calculator** — add/remove GST, rate presets.
- **vat-calculator** — inclusive/exclusive.
- **discount-calculator** — sale price, savings, stacked discounts.
- **profit-calculator** — profit, margin, markup.
- **scientific-calculator** — full sci calc: trig, log, powers, memory, radians/degrees, keyboard input, history.
- **date-calculator** — add/subtract days; difference between dates; business days.
- **mortgage-calculator** — monthly payment, breakdown, amortization + chart.
- **roi-calculator** — ROI %, annualized, gain.
- **tip-calculator** — tip %, split by people, round options.
- **margin-calculator** — margin/markup/revenue/cost solve‑for.

Calculator UX: labeled inputs with units, result in big mono, breakdown table/chart (`recharts`) where useful, copy result.

### 8.10 Utilities (15)
- **qr-code-generator** — text/URL/wifi/vcard → QR; size, color, ECC, logo overlay; PNG/SVG download. `client`. `qrcode`.
- **barcode-generator** — CODE128/EAN/UPC/etc; PNG/SVG. `client`. `bwip-js`.
- **color-picker** — visual picker → HEX/RGB/HSL/HSV, eyedropper (EyeDropper API), palette, copy. `client`.
- **color-converter** — convert between HEX/RGB/HSL/HSV/CMYK; live swatch. `client`.
- **uuid-generator-util** — same engine as dev UUID; friendly UI. `client`. (Distinct route/id from `uuid-generator`.)
- **random-number-generator** — range, count, unique toggle, sort. `client`.
- **random-password-generator** — like security one; utilities entry. `client`.
- **timestamp-converter** — date↔Unix timestamp (s/ms), timezone aware. `client`.
- **unix-time-converter** — Unix → human, live "now" clock. `client`.
- **coin-flipper** — animated flip, heads/tails, streak stats. `client`.
- **dice-roller** — N dice, M sides, sum, roll history. `client`.
- **stopwatch** — start/stop/lap, ms precision, keyboard. `client`. `performance.now()`.
- **timer** — countdown, presets, alarm sound + notification. `client`.
- **notepad-online** — autosave to localStorage, word count, download .txt, multiple notes optional. `client`.
- **todo-list-online** — add/check/delete/reorder, autosave localStorage, filter, clear‑done. `client`.

> Note the two UUID entries (`uuid-generator` in Developer, `uuid-generator-util` in Utilities) and two random‑password entries (`random-password-generator` in Utilities, `password-generator` in Security). Keep both routes; share the underlying component, differ only in copy/category. Total unique routes = 137.

---

## 9. Server / API contracts

Create `app/api/[...]` route handlers with typed request/response. Keep providers behind env vars so they're swappable. Never expose secret keys to the client.

- `POST /api/ai/:task` — body `{ text, options }` → streamed text. Tasks: summarize, paraphrase, rewrite, humanize, translate, write, email, grammar, detect. Backed by a model provider (configurable). Add per‑IP rate limiting + max input length.
- `POST /api/convert/office` — multipart file + `{ from, to }` → converted file. Backed by LibreOffice headless (a small containerized worker) or a hosted conversion API. Covers the 6 Office↔PDF tools + heavy compress fallback.
- `GET /api/net/dns?domain=` , `/whois?domain=`, `/ssl?domain=`, `/ip?addr=`, `/speed?url=`, `/broken-links?url=`, `/mx?email=` — network utilities. Validate input, timeout, concurrency limit, cache short‑lived.
- `GET /api/rates?base=` — currency rates (cached hourly).
- `GET /api/plagiarism` / search — only if a provider key is configured; otherwise the tool shows a "configure API key" state instead of faking results.

**If a provider/key isn't available at build time:** implement the full UI + the API route signature, and have the route return a clear `501 Not Configured` that the UI renders as "This tool needs an API key — see README." Do NOT fake outputs.

---

## 10. Privacy, security, correctness rules
- Client tools must not send file bytes anywhere. Add a test/assertion where practical.
- Sanitize any HTML you render from user input (formatters preview, SEO previews) — no `dangerouslySetInnerHTML` without DOMPurify.
- `unlock-pdf`/`protect-pdf`: show ownership disclaimer; never store passwords.
- Rate‑limit and validate every server route; set request size limits; strip/validate URLs (SSRF guard: block internal IPs/`localhost`/metadata endpoints on all net tools).
- No analytics that read file contents. If analytics at all, page‑level only, privacy‑friendly (Plausible‑style), disclosed in Privacy page.
- CSP headers, HTTPS only, `X-Content-Type-Options`, `Referrer-Policy`.

---

## 11. Performance
- Route‑level code splitting (App Router default). Heavy libs dynamically imported inside handlers only.
- Web Workers for OCR, background removal, upscaling, hashing big files, batch image ops.
- Preload fonts (subset Fraunces/Inter/JetBrains Mono), `font-display: swap`.
- Images: `next/image`. Reserve ad/section heights to avoid CLS.
- Target Lighthouse ≥ 95 performance / 100 a11y / 100 SEO on tool pages.

---

## 12. Repo structure
```
app/
  layout.tsx  globals.css  page.tsx (home)
  tools/page.tsx            (all tools)
  tools/[slug]/page.tsx     (dynamic tool renderer)
  category/[slug]/page.tsx
  about/ contact/ blog/ privacy/ terms/ disclaimer/ dmca/
  api/...
components/
  ui/            (Button, Input, Dropzone, ResultPanel, ToolShell, ...)
  layout/        (Header, Footer, AdSlot, ThemeToggle, SearchBar)
  tool-cards/    (ToolCard, CategoryCard)
tools/           (one folder per tool: index.tsx = the workspace UI)
  merge-pdf/  json-formatter/  ...
lib/
  tools.ts       (registry — source of truth)
  storage.ts  seo.ts  download.ts  worker helpers
workers/         (ocr.worker.ts, bg-removal.worker.ts, ...)
```
`app/tools/[slug]/page.tsx` looks the tool up in the registry, dynamically imports `tools/{slug}/index.tsx`, and wraps it in `ToolShell`. New tool = add registry entry + create `tools/{slug}/index.tsx`. Nothing else.

---

## 13. Build order (do it in phases; keep each phase shippable)
1. **Foundation:** Next.js + Tailwind tokens + fonts + theme toggle + `lib/tools.ts` with all 137 entries + Header/Footer + home hero (with one live mini‑tool) + `/tools` listing + `/category` + `/tools/[slug]` shell + 404 + sitemap/robots.
2. **Core primitives:** Button, Input, Dropzone, ResultPanel, ToolShell, Tabs, Toast, CopyButton, Dialog.
3. **Text + Developer + Calculators + Converters + most Utilities** (all client, no external services) — biggest, fastest‑to‑ship batch. ~60 tools.
4. **Client PDF tools** (merge/split/rotate/watermark/delete/reorder/jpg↔pdf/png↔pdf/pdf↔image/compress/sign/protect) + OCR (worker).
5. **Client image tools** (compress/resize/crop/rotate/convert/heic/svg/background‑remover(worker)/screenshot/image‑to‑pdf/upscaler).
6. **`edit-pdf`** (the annotation editor) — its own milestone.
7. **Server tools:** Office conversions + all network/security lookups + currency rates.
8. **AI tools** (streamed, behind provider) — ship last with graceful "needs key" states.
9. Polish: SEO/JSON‑LD everywhere, a11y pass, Lighthouse, Playwright route smoke tests, ad slots, legal pages, blog scaffold.

For each tool, when in doubt, follow the Tool Page Contract (§6) and the per‑tool spec (§8). Build the UI + states even if a backing service is stubbed — never fake results.

---

## 14. Definition of done (per tool)
- Route renders, metadata + JSON‑LD present, breadcrumbs + related tools correct.
- Input/processing/result/error states all implemented.
- Works on mobile (360px) and via keyboard; has copy/download where relevant.
- Client tools provably don't upload; server tools validate + rate‑limit + handle failure.
- Matches the design tokens (no stray colors, correct fonts, accent used once).
- Added to registry with correct category, runtime, keywords, blurb.

---

## 15. Copy & voice
Calm, precise, a little editorial. Short sentences. No hype, no "revolutionary". Trust lines are factual ("Runs in your browser. Files never leave your device."). Buttons are verbs ("Merge & download", "Compress", "Convert"). FAQ answers are 1–2 sentences.

---

Build faithfully to this spec. When a detail isn't covered, prefer: client‑side, private, instant, minimal, accessible, and consistent with the design system above.
