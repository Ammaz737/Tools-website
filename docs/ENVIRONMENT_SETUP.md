# Environment setup — 2026-10-13

MongoDB Atlas is the selected database. AI supports OpenAI, Google Gemini and local Ollama; choose any supported provider by supplying its existing variables. No additional provider integration or placeholder key is implied.

Copy `.env.example` to a private `.env.local` if one does not already exist. Preserve existing private configuration. Set `AI_PROVIDER` to `openai`, `gemini`, `ollama` or `auto`; fill only the corresponding key/model or local URL/model. Credentials must not use a `NEXT_PUBLIC_` prefix. No keys have been generated or supplied by the agent.

Set `MONGODB_URI` to the Atlas Drivers connection string, with URL-encoded database credentials, and `MONGODB_DB` to the target database. Use a dedicated user with read/write access to that database and restrict Atlas network access to deployment/development egress addresses. Set independent `ADMIN_PASSWORD` and a random `ADMIN_SESSION_SECRET` of at least 32 characters. Set `NEXT_PUBLIC_SITE_URL` to the actual HTTPS deployment origin before publishing.

Restart the application after changing environment values. Run `npm run check:config` for a secrets-safe configuration check; it prints only readiness labels and makes no requests. `npm run check:mongo` reads `.env` and then `.env.local` and tests Atlas connectivity. Live provider and Atlas checks remain pending until real credentials are configured. Deterministic regression tests deliberately clear external credentials and do not establish live readiness.


## 2026-10-16 service additions

Private `.env.local` and `.env.example` now include dedicated Copyleaks and optional native Office settings. Existing values were preserved. See [PLAGIARISM_SETUP.md](PLAGIARISM_SETUP.md) and [OFFICE_ENGINE_SETUP.md](OFFICE_ENGINE_SETUP.md) for authenticated webhooks, Atlas TTL storage, private worker isolation and live acceptance. Sandbox similarity output is simulated; keep it visibly labeled. Configure only server-side secrets. `npm run check:config` prints configuration labels, never secret values; it does not test live connectivity.


2026-10-18 hardening: Atlas SRV connections now use native MongoDB driver DNS discovery without changing process-wide DNS or manually rewriting hosts. Fix SRV DNS in the hosting environment. Production AI/plagiarism calls also require shared Atlas daily quota accounting; see [PROVIDER_QUOTAS.md](PROVIDER_QUOTAS.md). Live acceptance still requires configured credentials.

Native driver connection guidance: [MongoDB Node connection targets](https://www.mongodb.com/docs/drivers/node/current/connect/connection-targets/) and [connection options](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/). Atlas SRV discovery is left to the driver, preserving host rotation and TLS defaults.

The private local configuration selects DNS_RESOLVER_SERVERS=1.1.1.1 only when its slot was previously blank, matching the verified public DNS tool checks. This affects DNS/email tool resolvers only; no OS/global DNS setting is changed. Native MongoDB SRV discovery still uses the hosting environment DNS. Existing nonblank resolver settings are preserved.


2026-10-22 installation/live checkpoint: authenticated local native Office worker installed; four actual conversion fixtures pass with independent rendered-page review. Fixed stale spreadsheet cache via reviewed OOXML recalculation setting and cold startup via warm renderer initialization. Blank admin secrets initialized privately; actual HTTP authentication5/5 passes. OpenAI private configuration is now present and ten synthetic provider calls returnedHTTP200; see AI_LIVE_REPORT.md for semantic review and limits. Atlas/Copyleaks and public production acceptance remain pending.

## Admin configuration correction

The MongoDB value must contain only the connection URI. Use one assignment: `MONGODB_URI="mongodb+srv://USER:PASSWORD@HOST/DATABASE"`. Do not paste a second `MONGODB_URI=` inside the value. Restart the application after editing private environment files. The local admin server can explicitly load the file using `node --env-file=.env.local node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3102`. The authenticated recheck removed the false missing-configuration warning; Atlas connectivity remains a separate failed check. See admin-config-fix-results.json.

## 2026-10-23 Atlas admin recovery

See ATLAS_ADMIN_RECOVERY.md. The original URI/credentials now authenticate successfully; the current Atlas TCP path works. Router SRV/TXT DNS refusal was fixed with an explicit application-process DNS preload (APP_DNS_SERVERS), preserving native SRV/TXT/TLS and leaving Windows settings untouched. Actual admin API200 with137 rows and isolated Atlas insert/update/read/cleanup PASS. Earlier network-blocked/no-writes statements are historical. Public deployment, quota failover and remaining provider acceptance are still separate. Compatible Next/ESLint16.4.2 and DOMPurify3.4.17 security patches restore a zero-vulnerability production audit.
