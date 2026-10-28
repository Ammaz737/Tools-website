# Native Office conversion setup

Local installation and actual fixture verification completed 2026-10-22. See [NATIVE_OFFICE_LIVE_REPORT.md](NATIVE_OFFICE_LIVE_REPORT.md): four native conversion cases and independent rendered output checks pass. This is scoped local evidence, not a public deployment or a guarantee for arbitrary Microsoft Office documents.

## Private configuration

The local `.env.local` contains generated worker authentication and configured loopback endpoint; existing nonblank settings were preserved. Never commit credentials.

- `OFFICE_CONVERTER_URL`: fixed operator-controlled base URL. Local: `http://127.0.0.1:3101`; application on the production private Docker network: `http://office-converter:3000`. No credentials/path/query/fragment in the URL.
- `OFFICE_CONVERTER_AUTH_HEADER`: private complete Authorization header. The local setup uses Basic authentication.
- `OFFICE_CONVERTER_USERNAME` / `OFFICE_CONVERTER_PASSWORD`: private local worker credentials consumed by Compose, not public application variables.
- `OFFICE_CONVERTER_TIMEOUT_MS`:1000–60000, default30000; tool-specific timeout may shorten it.

Start the local worker with the explicit development override:

```powershell
docker --context desktop-linux compose -p tools-site-qa --env-file .env.local -f infra/office-converter/compose.yaml -f infra/office-converter/compose.local.yaml up -d --build --wait --wait-timeout 120
npm run check:office:live
```

Stop only this worker when finished:

```powershell
docker --context desktop-linux compose -p tools-site-qa --env-file .env.local -f infra/office-converter/compose.yaml -f infra/office-converter/compose.local.yaml stop office-converter
```

Production uses the base Compose fragment with no published host port and an internal network attached only to the application. Local Docker Desktop host access requires the separate bridge override, published exclusively on127.0.0.1 with authentication. The local bridge is not network-level egress isolation; URL deny policies still apply. Do not deploy the local override publicly.

## Reproducible worker

The custom Dockerfile pins Gotenberg 8.38.0 to digest `sha256:c36cdd730893e3941d27a196ff8b68675e473642d067ec7ee3668b9adaa37b75`. Its reviewed configuration changes only the LibreOffice OOXML recalculation-on-load default. The build fails if the expected registry property changes, requiring review on upgrades. LibreOffice 26.8.1.1 was used for the recorded fixture results.

Native spreadsheet conversion recalculates supported formulas rather than trusting stale cached values. This fixed a fixture whose10+20 formula was cached as 999; output now contains 30. Excel-specific functions, external links and licensed fonts can differ; verify important totals and layouts. No macros or linked resources are enabled. The UI discloses recalculation when server spreadsheet processing is selected.

The worker runs UID/GID 1001, read-only root, dropped capabilities/no privilege escalation,1 CPU / 2 GB memory/128-process limit and bounded temporary storage. Chromium/downloadFrom/webhooks/PDF manipulation routes are disabled. LibreOffice is warmed before accepting conversions, with a bounded 60-second renderer startup and 90-second API startup allowance; conversion request deadlines remain bounded. The upstream Tini entrypoint handles child reaping. No host file volumes are mounted. Reviewed fonts must be installed in a custom image for production-specific typography.

## Application API and limits

`GET /api/convert-office` returns `{available:boolean}` based on configuration; it is not a health certificate. POST requires matching Origin and raw `application/octet-stream` bytes with these query pairs:

| toolId | format |
| --- | --- |
| word-to-pdf | docx |
| excel-to-pdf | xlsx |
| powerpoint-to-pdf | pptx |

No legacy DOC/XLS/PPT, macro files, arbitrary URLs/options or PDF-to-editable-Word are accepted by this adapter. The UI offers a separate local browser option and explicitly discloses uploads for server conversion.

Actual upload bytes are counted, limited to 20 MiB with a 5-second ingestion deadline. OOXML signatures/package budgets, per-tool maintenance/size/timeout and concurrency/rate controls are enforced. Worker redirects are rejected and fixed filenames are used. Output must be a real unencrypted PDF, at most 20 MiB / 50 pages with bounded page dimensions/total area. Error/authentication details are sanitized. Shared ingress capacity remains a deployment requirement. Submitted fixture documents/PDFs were absent from worker `/tmp` after completed requests; hosting logs/retention still require deployed review.

## Evidence and remaining acceptance

`npm run check:office:live` uses the real application route and native worker, disabling Atlas only in its own process. Generated PDFs, inputs and rendered pages are in `docs/quality-evidence/native-office/`. The recorded source hashes invalidate stale native assertions when relevant source changes. `scripts/render-native-quality.py` uses bundled Poppler/Pillow for independent pixel checks. Every output page was visually inspected.

Live provider keys, Atlas persistence/quota concurrency, native complex fonts/functions/SmartArt, cross-browser/performance/accessibility, ingress/egress and recovery still require authorized configured staging acceptance. Local fixtures do not establish perfect conversion.

Sources: [Gotenberg configuration](https://gotenberg.dev/docs/configuration), [LibreOffice conversion](https://gotenberg.dev/docs/convert-with-libreoffice/convert-to-pdf), [LibreOffice formula-load policy](https://help.libreoffice.org/latest/en-US/text/shared/optionen/01060900.html).

Initialize only blank local credentials with npm run setup:local before Compose startup. The current verified production-mode local application is http://localhost:3102 . Use localhost for browser Secure-cookie acceptance. For browser verification: set LOCAL_CHECK_BASE_URL to http://localhost:3102 and run node --env-file-if-exists=.env.local scripts/check-local-browser.mjs.
