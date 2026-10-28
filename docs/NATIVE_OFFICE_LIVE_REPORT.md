# Native Office installation and actual output verification — 2026-10-22

Installed and configured a local Docker Office worker, with a digest-pinned Gotenberg 8.38.0 base and LibreOffice 26.8.1.1. The worker runs as UID/GID 1001 with read-only root, dropped capabilities, bounded memory/process/temp storage, authentication and host exposure restricted to 127.0.0.1:3101. Production Compose retains its unexposed internal network; the explicit local override uses a development bridge so the host application can reach it. URL deny rules remain enabled; this local arrangement does not prove deployed egress isolation.

Actual application-route conversion checks: **4/4 PASS**. Two Word fixtures cover PDF page images and editable tables, both with two mixed-size pages. Spreadsheet verification covers two sheets and an intentionally stale formula cache: 10+20 must become 30, replacing999. Mixed-content PowerPoint preserves heading, body, embedded image, vector graphic and two 720×360-point slides. PDFs were independently parsed and every output page was rendered with Poppler and visually inspected.

Page-image Word output versus source PDF mean RGB channel errors were3.35/4.47/4.39 on page1 and1.82/2.90/2.87 on page2 (threshold6). The slide graphic retained exactRGB0/102/204 at the expected location. Editable Word table borders/text are readable, but the mode intentionally reconstructs approximate text/tables and omits source graphics/styles. These checks certify the fixture assertions, not arbitrary layouts or Microsoft Office compatibility.

## Failures found and repaired

The upstream worker preserved a stale Excel formula cache. The custom Dockerfile now enables the documented LibreOffice OOXML recalculation-on-load policy; the exact same999-versus30 fixture passes. Recalculated values can differ for Excel-specific functions and external links; the UI discloses this and important totals need review. No macros or external linked content are enabled.

A cold-worker rerun timed out before LibreOffice started. Warm startup is now enabled outside the conversion request, with a bounded 60-second startup and 90-second API startup allowance. Request processing deadlines remain bounded. Duplicate Docker init was removed because upstream already uses Tini. Original failed evidence is retained in native-office-first-attempt.json and native-office-startup-attempt.json.

## Authentication verification

Private strong admin password/signing secret were generated only for blank settings, preserving existing values. Actual production HTTP login/session/tamper/logout checks pass5/5. The first authenticated read hit a cold-request timeout; retained in local-admin-first-attempt.json, then passed on recheck. Atlas is explicitly unconfigured, so these reads verify default rows and authentication rather than persistence. Credentials/cookies are absent from reports. The worker rejects unauthenticated conversion with 401.

Evidence: native-office-quality-results.json, native-office-worker-evidence.json, quality-evidence/native-office/visual-comparison.json and local-admin-live-results.json. Browser verification and final build checks are recorded separately after the application restart.

OpenAI credentials are now configured and ten separate synthetic provider calls returned HTTP200 (see AI_LIVE_REPORT.md). Copyleaks/Atlas credentials, public HTTPS origin and staging configuration remain absent. Native Office checks made no paid calls; no Atlas writes occurred. Live provider accuracy, Atlas persistence/quota concurrency, complex Office functions/fonts, performance and deployed ingress/egress/recovery remain production acceptance.

Sources: [LibreOffice formula load behavior](https://help.libreoffice.org/latest/en-US/text/shared/optionen/01060900.html), [Calc registry schema](https://github.com/LibreOffice/core/blob/master/officecfg/registry/schema/org/openoffice/Office/Calc.xcs), [Gotenberg worker configuration](https://gotenberg.dev/docs/configuration).

Final actual browser verification: login/logout and authenticated native upload/download2/2 PASS at localhost:3102 (local-browser-live-results.json). PDF raster Blob storage was stabilized while the canvas is alive, with a data-URL fallback for unreadable encoder storage; roundtrip and injected read-failure checks2/2 PASS. Latest unit96/typecheck/build/lint184 checks pass.
