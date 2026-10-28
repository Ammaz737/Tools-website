# Dedicated plagiarism checking setup

The plagiarism workspace now uses a dedicated Copyleaks scan workflow, not an LLM-generated plagiarism score. It submits UTF-8 text as `text.txt`, stores an anonymous job in MongoDB Atlas, receives an authenticated status webhook and lets the originating browser poll with a secret capability token. The public report shows the returned similarity percentage and safe public web source links. It does not claim authorship, prove plagiarism, reproduce detailed matched passages or guarantee that every source was searched.

## Private environment values

Set these in `.env.local` or deployment secret storage; never commit real values:

- `COPYLEAKS_EMAIL`: API account email.
- `COPYLEAKS_API_KEY`: corresponding API key.
- `COPYLEAKS_WEBHOOK_SECRET`: independent randomly generated printable ASCII secret, 32–128 characters; the provider sends it in the documented custom status header.
- `COPYLEAKS_SANDBOX=true`: default, returns simulated results. Only explicit `false` permits real scans and potential credit consumption. Invalid values fail closed.
- `NEXT_PUBLIC_SITE_URL`: actual public HTTPS origin without credentials, paths or query parameters; callbacks must reach it over HTTPS.
- Existing `MONGODB_URI` and `MONGODB_DB`: Atlas connection and database. Atlas persistence is required before submitting a scan.

No live provider requests or paid scans were made during implementation. Credentials, reachable staging callbacks and live Atlas acceptance remain BLOCKED until configured and verified. Do not treat sandbox results as measurements of the submitted text. Production enablement additionally needs an account spending limit and live acceptance of the shared Atlas daily request quota (see PROVIDER_QUOTAS.md); request caps do not guarantee a fixed currency budget. Per-minute ingress protection remains a hosting requirement.

## Request and storage behavior

`POST /api/plagiarism` accepts `{ text, consent: true }`, requires a same-origin browser request and the exact `plagiarism-checker` availability/maintenance/input guard. The hard limit is 20,000 characters; request bodies are bounded. It creates a pending Atlas record before any provider submission and returns a random job ID plus a 256-bit access token. The token is returned once and retained in browser component memory only. Atlas stores its SHA-256 hash, state, timestamps, sandbox flag and normalized result, never the submitted text or clear token. Reloading the page loses that token; anonymous checks have no account recovery feature.

`GET /api/plagiarism/{jobId}` requires the token in an Authorization Bearer header. Missing/incorrect credentials and expired or unknown jobs return the same not-found response. Poll responses use `no-store`; tokens never enter query strings. The UI polls every three seconds for up to five minutes and offers checking an existing result again without submitting another scan. Clear stops browser work and removes local state; it does not cancel a scan already sent externally.

`POST /api/plagiarism/webhook/{jobId}/{status}` verifies `x-plagiarism-webhook-secret` with constant-time digest comparison before reading its bounded body. Copyleaks `properties.webhooks.statusHeaders` supplies this header. Completed callbacks must match the scan ID, successful status and a finite numeric similarity score from 0–100. Source links allow HTTP/HTTPS only and reject embedded credentials; output is capped at 50 links with 300-character titles. Error callbacks mark pending jobs failed. Terminal jobs are immutable, so repeated or delayed callbacks cannot overwrite completed results. Nonterminal documented status callbacks are acknowledged without inventing progress percentages.

Atlas `plagiarism_jobs` uses unique `_id` job IDs and a TTL index on `expiresAt` set to 24 hours. Queries enforce expiry even before MongoDB's asynchronous TTL cleanup. The external scan requests a one-hour retention period after completion and disables shared-database/repository indexing; provider cleanup can lag expiry. Operators must assess the provider agreement and data retention before enabling real scans. Logging, ingress and infrastructure must not log Authorization or callback-secret headers.

Provider calls use fixed official HTTPS hosts, reject redirects, bound response reads to 1 MiB, enforce deadlines and expose sanitized errors only. Authentication is cached for 47 hours per process with single-flight login; it is not shared across replicas. No automatic submission retry is performed after an ambiguous failure, avoiding accidental repeated scans/charges. A submission failure after provider acceptance can require operator investigation; full reconciliation/cancellation/export of detailed result ranges is outside this summary integration.

## Verification

`node --import tsx --test tests/plagiarism.test.ts` passes 12 mocked contract/security cases: fail-closed configuration, sandbox default, random/hash-only poll credentials, exact webhook authentication, documented completion parsing, strict score validation, unsafe-link removal and output bounds, exact UTF-8 submit/login/header contract, concurrent login caching, bounded/sanitized upstream errors, input bounds, same-origin/consent enforcement and invalid poll credential rejection. These tests do not claim real provider, webhook delivery or Atlas persistence acceptance. Coordinating regression must still exercise the public workspace after dispatcher integration.

## Official contract references

Reviewed against current official documentation during implementation:

- [Authentication](https://docs.copyleaks.com/using-the-apis/authentication)
- [Submit file and custom status headers](https://docs.copyleaks.com/reference/actions/authenticity/submit-file)
- [Text plagiarism workflow](https://docs.copyleaks.com/guides/authenticity/detect-plagiarism-text/)
- [Completed webhook and similarity summary](https://docs.copyleaks.com/reference/data-types/authenticity/webhooks/scan-completed/)

Run a staging sandbox check, validate Atlas job creation and expiry, verify authenticated callback delivery, inspect the displayed simulated score/source summary, reject forged callbacks and cross-job poll tokens, then explicitly approve/configure real credit-consuming scans separately. Until those checks pass, live plagiarism readiness remains unverified.


2026-10-18 hardening: Atlas SRV connections now use native MongoDB driver DNS discovery without changing process-wide DNS or manually rewriting hosts. Fix SRV DNS in the hosting environment. Production AI/plagiarism calls also require shared Atlas daily quota accounting; see [PROVIDER_QUOTAS.md](PROVIDER_QUOTAS.md). Live acceptance still requires configured credentials.
