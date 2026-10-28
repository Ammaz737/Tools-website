# Cross-browser verification — 2026-10-22

The pending Firefox/WebKit checks were performed against the existing implementation. A real early-input bug was found and fixed; completed outputs and prior source changes were preserved.

## Product defect repaired

WebKit could enter a value into server-rendered controls before React attached its handlers. The DOM showed -1 while the area converter retained its initial positive result. Waiting for actual handler attachment made the unchanged calculation correct. See hydration-reproduction-results.json.

The shared ToolDispatcher now renders a disabled, aria-busy fieldset until client hydration commits. This covers native tool inputs, selects and buttons. It uses a stable useSyncExternalStore server/client snapshot; there is no arbitrary delay. Regression coverage deliberately blocks application scripts, verifies disabled controls, releases scripts and verifies invalid-input rejection and the exact subsequent calculation. A second test verifies immediate XML processing retains the first entered text. Installed Next.js client-boundary guidance and Modern Web Guidance were consulted.

## Recorded outcomes

| Engine | Evidence | Latest outcome |
|---|---|---|
| Firefox 157 | 164 pre-fix scenario outcomes across the preserved initial/resumed run; 16 focused current-build regressions including two new hydration cases | No unresolved failures; 166 distinct latest scenario outcomes |
| Playwright WebKit 27.2 | Current-build full166 run had165 passes and one Office transport-inspection failure; that one case passed the targeted actual-byte recheck | 166 distinct latest scenario outcomes pass |
| Chromium | Historical full163 retained; rebuilt application focused hydration/document/upload/UI regressions | 16/16 current focused checks pass |

This is not a single uninterrupted 332-pass run. cross-browser-summary.json merges the exact latest outcomes with prior and current build IDs. Raw failed reports/logs are preserved. The full historical Chromium suite was not repeated unnecessarily; the shared boundary and affected behavior were rechecked.

The first Firefox attempt suffered memory pressure (about500MiB free) and a timestamp test timeout. Only the owned runner tree was stopped, completed38 passes were preserved, and unfinished checks resumed with bounded browser process counts. The unchanged timestamp assertions then passed. No unrelated browser/app processes were intentionally stopped.

WebKit's intercepted-request API omitted the Blob body in the Office transport mock. The test now routes the synthetic document to a real loopback HTTP receiver and verifies exact received bytes, content type and query mapping, then supplies a synthetic PDF response. The same stronger assertion passes WebKit, Firefox and Chromium. This is upload transport/UI evidence; the separate native4/4 live worker report remains the service-rendering evidence.

## Reports and rerun commands

- cross-browser-results.json: full current-build WebKit165/166 initial run.
- cross-browser-webkit-recheck-results.json: remaining Office transport case1/1.
- cross-browser-firefox-focused-results.json: current Firefox16/16.
- hydration-chromium-results.json: current Chromium16/16.
- cross-browser-before-fix-passes.json and the resource-pressure/before-hydration logs: preserved earlier evidence.
- cross-browser-summary.json: latest per-engine aggregation, scope and build IDs.

Run `npm run test:e2e:cross` for all current Firefox/WebKit scenarios. The test server disables private integrations and uses loopback port3100. Browser engine installation: `npx playwright install firefox webkit`. Playwright WebKit on Windows is not certification of all Safari releases/devices. Accessibility, performance and deployed ingress/recovery acceptance remain separate.

## Atlas and production boundary

The user-provided URI was corrected by removing a duplicated variable-assignment prefix. Fyp Atlas dashboard confirms the cluster is Active, current IP is allowed, and configured hostname/username match. System DNS returns ECONNREFUSED. Explicit DNS resolves all three members, but direct TCP connections to their database ports time out before TLS/authentication. Do not interpret this as verified credentials or persistence. No Atlas writes occurred.

The actual production-mode AI POST handler returns503 and sends zero provider requests when Atlas is unreachable. See ai-production-route-live-results.json and atlas-live-results.json. No new paid AI requests were made in this continuation; the previous ten actual provider responses remain separately recorded. Copyleaks/public HTTPS and live Atlas persistence/shared-quota failover remain blocked.
