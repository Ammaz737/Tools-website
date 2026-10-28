# Quiet Workshop — Improved Audit Fix Plan

**Based on:** your Tools Audit & Fix Plan + live code review of `lib/office-client.ts`, `lib/docx-from-text.ts`, `lib/pdf-client.ts`, `tools/office/OfficeTools.tsx`, `app/api/convert-office/route.ts`.

**Core rule (non‑negotiable):**

> **Pehle saari tools ki detailed audit → findings freeze → phir category/batch ke hisaab se fix.**  
> Blind fix nahi. Koi tool “fixed” tabhi jab uski audit row complete ho aur verify checklist pass ho.

```
TOOLS.md (inventory)
    ↓
Phase AUDIT — all 137 tools, per-tool detail sheet
    ↓
AUDIT-RESULTS.md (severity: severity, evidence, fix type)
    ↓
Phase FIX — only from backlog, highest severity first
    ↓
Phase VERIFY — smoke / fixtures / maturity update
```

---

## A. Corrections already known (seed findings — not a substitute for full audit)

| Claim | Reality in repo today |
|-------|------------------------|
| Word→PDF = `mammoth` → `jspdf` HTML reflow | **Upgraded:** `docx-preview` → per-page `html2canvas` → `jspdf` images. Remaining: font overflow, page breaks, memory. |
| PDF→Word defaults to editable | **Defaults to `exact`**. Editable is opt-in. |
| Exact PDF→Word margins | **Fixed** (`margin` + zero). |
| `/api/convert-office` | **410 stub** — LibreOffice not wired. |
| Rate limiting | **Missing** on `/api/*`. |
| `heic2any` / `zxcvbn` / `luxon` / `@imgly/background-removal` | **Not installed**. |

These are **starter findings**. Full per-tool audit (Phase AUDIT) can add / change priority.

---

## B. Phase AUDIT — all 137 tools (do this before major fix waves)

**Goal:** Har tool ka honest, code-backed status + bugs list — ek jagah.

**Deliverable:** `AUDIT-RESULTS.md` (or `docs/audit/YYYY-MM-DD.md`) with one row (or short section) per tool id.

### B.1 Per-tool audit checklist (har tool par yeh fill karo)

| Field | What to record |
|-------|----------------|
| **id / name / category** | From `lib/tools.ts` |
| **Route** | `/tools/{id}` loads? 200? |
| **Dispatcher** | Wired component vs `ToolPlaceholder` |
| **Maturity** | `full` \| `degraded` \| `placeholder` |
| **Runtime honesty** | Registry `client`/`server` matches real behavior? |
| **Code path** | File(s) + shared component? |
| **Libs / API** | npm packages / `/api/*` / env keys |
| **Happy path** | 1–2 manual or scripted smoke steps |
| **Failure path** | Bad file, empty input, no API key — user-visible error? |
| **UX contract** | Input / processing / result / clear / privacy or config note |
| **Mobile** | Usable at ~360px? |
| **Privacy / security** | Client tool uploads? Password stored? SSRF risk? |
| **Issues found** | Bullet list with severity `P0`–`P3` |
| **Fix type** | `label` \| `bugfix` \| `harden` \| `implement` \| `lib-install` \| `server` \| `defer` |
| **Evidence** | File:line or screenshot note |

### B.2 Audit order (category batches — complete one batch before next)

| Batch | Category | Count | Focus |
|-------|----------|------:|-------|
| A1 | PDF + Office converters | 22 | Fidelity, clip/shift, compress/OCR/edit honesty |
| A2 | Image | 18 | HEIC, bg-remove, upscaler labels, converters |
| A3 | AI | 11 | No-key UX, 20k limit UI, plagiarism honesty |
| A4 | Text | 11 | Unicode/emoji counters, edge cases |
| A5 | Developer | 19 | Placeholder vs wired; hash/JWT safety |
| A6 | SEO | 10 | Placeholders + crawl tools |
| A7 | Security | 7 | Rate limits, timeouts, zxcvbn gap |
| A8 | Converters | 9 | Math accuracy; luxon gap |
| A9 | Calculators | 15 | Shared EMI/GST bugs; placeholders |
| A10 | Utilities | 15 | localStorage honesty; placeholders |

**Exit criteria for Phase AUDIT:**
- [ ] All **137** ids have a row in `AUDIT-RESULTS.md`
- [ ] Maturity counts match reality (not only `TOOLS.md` guesses)
- [ ] P0/P1 backlog sorted (Office fidelity, silent failures, fake Implemented)
- [ ] Shared-component map listed (one bug → N tools)

**Time box:** ~3–5 days (A1 deepest; A4–A10 faster). Do **not** start large fix PRs until A1–A3 at least are written; full A1–A10 before claiming “all tools audited.”

### B.3 Audit tooling (optional speed-ups)

1. Script: parse `lib/tools.ts` + `tools/index.tsx` → generate skeleton rows (id, wired?, placeholder?).
2. Playwright: visit every `/tools/{id}` → status code + “placeholder” vs real Dropzone/ResultPanel heuristic.
3. Manual deep QA only for **file/Office/AI/server** tools (high risk).

---

## C. Improvements kept from prior plan (apply during FIX, after audit)

1. Three modes: Exact (browser) / Editable (browser) / High fidelity (LibreOffice).
2. Word→PDF harden: page/size caps, overflow toggle, DPI, fixtures.
3. PDF→Word editable: line-grouping + OCR deep-link for scans.
4. Whole Office suite honesty (especially PPTX→PDF text-only).
5. Maturity in registry / `TOOLS.md`.
6. Shared quality bar before marking `full`.
7. Failure logging via existing usage API (no file bytes).
8. Rate limit + SSRF on server routes.
9. Placeholder batches by dependency class.
10. Privacy: LibreOffice opt-in only.

---

## D. Phase FIX — only from audit backlog

**Rule:** Har fix PR ke description mein `AUDIT-RESULTS` row ids link karo. No orphan fixes.

### Fix waves (after audit findings freeze)

| Wave | When | Scope |
|------|------|-------|
| **F0 — Labels** | After A1–A2 (or sooner if already known) | Degraded tools: heic, bg-remove, upscaler, pptx honesty |
| **F1 — Office P0** | After A1 complete | Client harden Word↔PDF + Office warnings |
| **F1b — LibreOffice** | Decision 1/2/3 + infra | Optional server path |
| **F2 — Tests** | With F1 | Fixtures + smoke for audited Office/PDF issues |
| **F3 — Placeholders** | After A5–A10 rows exist | Implement only tools audited as `placeholder` + `implement` |
| **F4 — Libs** | After degraded confirmed in audit | heic2any, zxcvbn, luxon, bg-removal |
| **F5 — API harden** | After A3 + A6 + A7 | Rate limit, SSRF, AI counter |
| **F6 — Heavy leftovers** | Last | sitemap, keyword density, sci/mortgage calc, OCR DPI |

Inside each wave: **audit subset → fix subset → verify subset → update AUDIT-RESULTS status to `fixed`.**

---

## E. Phase VERIFY (per fixed tool)

- [ ] Re-run per-tool checklist fields that failed
- [ ] Maturity upgraded only if deserved (`degraded` → `full` needs lib + happy path)
- [ ] `TOOLS.md` / registry synced
- [ ] No new silent failures

---

## F. Priority table (audit-first)

| Priority | Work | Gate |
|----------|------|------|
| **P0** | Phase AUDIT A1 (PDF/Office) + A2 (Image) + A3 (AI) | Must finish before big Office rewrite |
| **P0** | Complete Phase AUDIT A4–A10 (all remaining tools) | Before claiming full audit done |
| **P0** | F0 labels from audit | After A1–A2 findings |
| **P0** | F1 Office harden from A1 findings | A1 exit criteria met |
| **P1** | F2 fixtures/tests | Locks F1 |
| **P1** | F3 placeholders (batched) | Each batch audited first |
| **P2** | F4 libs + F5 API | Audit confirmed gaps |
| **P3** | F6 heavy | After quick wins |

---

## G. Suggested timeline

| Week | Focus |
|------|--------|
| **Week 1** | AUDIT A1–A3 deep + skeleton script for all 137 rows; start F0 labels for confirmed degraded |
| **Week 2** | AUDIT A4–A10 complete → freeze backlog; start F1 Office harden |
| **Week 3** | F1 finish + F2 tests; begin F3 calculators/converters |
| **Week 4+** | F3 SEO/dev/utils; F4 libs; F5 API; F1b LibreOffice if hybrid chosen |

---

## H. Success metrics

- `AUDIT-RESULTS.md` has **137/137** tools audited
- Zero tools marked `full` that fail Chrome happy path without a clear error
- Fix PRs map 1:1 to audit issue ids
- Placeholder count ↓ only for tools that were audited as implementable
- Word↔PDF exact: no clipped text on fixture set (after F1)
- `/api/*` rate-limited after F5

---

## I. Decision needed from you

1. **LibreOffice:** browser-only / **hybrid (recommended)** / server-first  
2. Confirm workflow: **Audit all categories first (A1–A10), then fix waves** — yes (this plan assumes yes)  
3. Audit depth for low-risk text/calc tools: **full checklist** vs **lightweight** (route + dispatcher + one smoke)? Recommendation: lightweight for text/calc/util placeholders; **full** for PDF/Image/AI/Security/Office.

Reply with LibreOffice choice (**1/2/3**) and audit depth preference if you want to start Week 1.
