# Atlas admin connection recovery — 2026-10-23

The recurring GET /api/admin/tools500 was caused by router DNS refusing Atlas SRV/TXT discovery. The URI and credentials were valid: an isolated resolver authenticated and pinged Atlas, and all three member TCP ports were reachable in the current recheck.

## Fix

`APP_DNS_SERVERS=1.1.1.1,1.0.0.1` is configured privately for this project. `scripts/app-dns.mjs` validates the optional IP list and changes DNS resolver state only inside the application processes. `scripts/run-next.mjs` uses Next's official environment loader and preloads this module before Next starts, including dev child processes. npm dev/start/check:mongo use this path. No Windows adapter, router, firewall or account permissions were modified. Global Wi-Fi DNS modification was rejected by automatic approval review, and was not retried or bypassed; the narrower application-scoped alternative succeeded.

The database helper still uses the original mongodb+srv URI, native SRV/TXT discovery, driver topology handling and certificate validation. No host lists are rewritten and no TLS checks disabled. Blank APP_DNS_SERVERS preserves system DNS. This is an explicit application-wide resolver choice, not a MongoDB-client-only resolver hook. Unset it and restart to return to system DNS; do not enable it on hosts whose DNS already works unless desired.

## Actual evidence

- Normal `npm run check:mongo`: Atlas connection/ping PASS.
- Actual dev admin login200; GET /api/admin/tools200, mongoConfigured=true,137 rows. The normal GET can seed missing registry defaults/indexes.
- Isolated qa_connection_checks record: majority-acknowledged insert/update, readback and exact-id cleanup PASS. No existing tool settings were changed by the persistence probe.
- Reports: admin-atlas-recovery-results.json and atlas-persistence-results.json. No cookies, credentials or raw provider/database errors are recorded.

Earlier reports stating that all database TCP ports timed out are historical; connectivity changed by this recheck. Default router SRV resolution still fails, but the configured project startup path works. Atlas quota concurrency across app instances, primary failover, provider-route acceptance and public deployment checks remain separate.

## Security patches

Startup emitted a real advisory and a fresh production audit found critical Next.js/DOMPurify findings. Compatible patches were installed: Next.js and eslint-config-next16.4.2, transitive DOMPurify3.4.17. Fresh production audit now reports zero vulnerabilities; five high development-tool findings remain. Relevant build/type/unit/browser validation is recorded separately after these patches.

Final validation after compatible security patches:98/98 units, TypeScript, production build and191-file clean lint. Seven focused browser regressions pass (atlas-fix-browser-results.json). Patched Next16.4.2 dev server is running on port3000. Three authenticated admin reads return200 with137 rows; admin save of unchanged visibility returns200 and survives fresh read. Existing visibility choices were not flipped. Atlas fixture persistence/cleanup passes; the broad production rollout remains separate.
