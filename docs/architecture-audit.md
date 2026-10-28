# Architecture audit

Inspected 2026-10-11. Existing Next.js App Router / React 19.2.4 / TypeScript application, Tailwind 4 and custom shared UI. Next.js upgraded from 16.2.12 to 16.4.0 to address audited critical dependency advisories. Preserve this stack and Quiet Workshop design.

- Registry: `lib/tools.ts`; dispatcher: `tools/index.tsx`; stable URL: `/tools/[slug]`. Ten categories, 137 IDs, 103 wired, 34 placeholders.
- Rendering: server tool/category landing pages contain metadata and content; interactive workspaces execute in the browser. Processing location is independent of SEO rendering.
- Browser processing: pdf-lib, @cantoo/pdf-lib, pdf.js, DOCX/PPTX/XLSX converters, canvas image processing, text/hash/calculator utilities. Heavy work still needs memory/worker review.
- Backend: Next route handlers for AI, network lookups, rates, admin and usage. MongoDB `tool_status` stores activity flag and page-use count. This is not successful-execution accounting.
- Authentication: shared admin password and HMAC-signed HTTP-only cookie. Maintenance and bounded processing configuration, backend guards and persistent audit intent are implemented. Roles, provider dashboard, durable quotas, completed-change audit viewer, queue and background-worker deployment remain pending.
- Integrations: optional MongoDB, OpenAI/Gemini/Ollama and public DNS/RDAP/IP/rates services. Office server conversion route is a stub. No live services were verified during discovery.
- Testing at resume: no test runner command; one private-path PPTX script. No CI or master test reports found. The historical audit is static and must not be treated as coverage.
- Deployment: standard Next scripts; no checked-in production infrastructure configuration discovered. Hosting cost, field Web Vitals, traffic and provider costs are unmeasured.

See the implementation queue and security audit for concrete work. No architectural rewrite is warranted by these findings.
