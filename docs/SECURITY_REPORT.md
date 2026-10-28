# Security report

Reviewed 2026-10-11. Scope: current source changes for administrator authentication, processing availability, AI integrations and network tools. This report does not claim a penetration test, a production deployment, or successful live provider calls.

## Implemented protections

### Administrator and configuration controls

Admin authentication requires a password and a separate session secret of at least 32 characters; there is no insecure development signing fallback. HMAC verification uses timing-safe comparison and rejects malformed, expired and future-dated tokens. Cookies are HTTP-only, SameSite=Lax, and Secure in production. Login is limited to five requests per minute. Login, logout and configuration mutation handlers require an exact same-origin request.

Configuration patches allow only supported fields and bounded values. MongoDB receives an audit intent with tool ID, actor, patch and timestamp before a mutation. Audit-write failure prevents the update. These are separate writes, so the audit describes an attempted change and is not proof that a change completed. There is a shared admin identity rather than individual administrator attribution.

The processing guard checks tool existence, disabled state, maintenance state and configured input limits. Status storage failures return an unavailable response. Public tool reads no longer restore all tools as active after database errors. Configuration checks in browser tools improve the interface but cannot stop a user running downloaded client code independently.

### Network and SSRF controls

URL validation allows HTTP and HTTPS on ports 80/443, rejects URL credentials and local hostnames, normalizes IP literals and rejects private/reserved IPv4 and IPv6 ranges, including IPv4-mapped IPv6. DNS resolution checks every returned address; one restricted answer rejects the target. The HTTP transport resolves each hop once and pins an approved address using Node's connection lookup callback, retaining the original hostname for Host, SNI and certificate verification. Each redirect is revalidated and redirects are finite. Discovered links pass validation before an outbound probe.

Safe HTTP requests have a whole-request deadline, a bounded response body (2 MiB default), and a process-wide cap of 24 active requests. Crawling probes up to 12 discovered links with four concurrent link checks; rejected HEAD requests can fall back to bounded GET. Page size is measured in UTF-8 bytes. SSL inspections pin an approved IP, have a 24-inspection process cap and a deadline, and report certificate validity using chain authorization, hostname matching and validity dates. The inspector deliberately retrieves invalid certificates to report them; it does not label an invalid certificate as valid.

DNS/MX routes use independent resolvers with finite attempts, deadlines and cancellation. MX presence is reported as routing information, without asserting that a mailbox exists or receives mail. IP lookup requires an explicit public IP/domain, never substitutes server geolocation for an empty request, encodes a resolved IP into the fixed provider path and sanitizes output. RDAP and currency routes use bounded safe transport and validate provider payloads. Non-successful RDAP responses return failure; currency errors do not return fabricated offline rates. Network tools enforce a 30/minute per-tool rate limit and consume configured input and timeout settings.

### AI and request handling

AI requests validate supported task/tool combinations, option types and prompt size. Streamed JSON input has byte and time limits; admin JSON requests have a smaller limit. Provider calls refuse redirects, bound generation output and response bytes, and enforce a deadline covering fetch and response reading. Gemini credentials are sent in a header rather than the URL. Provider diagnostics are not returned or logged raw. Invalid/missing detector scores fail rather than becoming a fabricated zero score. Unconfigured integrations and unsupported web plagiarism verification return honest failures.

OpenAI/Gemini URLs are fixed in source. Ollama uses an operator-controlled base URL and intentionally supports a local service; it must be configured through trusted deployment settings. This is outside the public user-controlled URL transport.

## Verification and limitations

The targeted SSRF/transport/network-route suite passed four deterministic test groups. It uses injected DNS answers and mocked HTTP/provider responses, with no public network required. Coverage includes encoded/private/mapped IPs, mixed public/private DNS answers, pinned connection lookup, private redirects, redirect DNS answers changing to private IPv6, finite redirects, oversized bodies, timeouts, malformed inputs, missing MX, sanitized provider failures and removal of fake upstream success. Project TypeScript and targeted ESLint checks passed for these changes.

Additional regression files cover admin token configuration and forgery, rate-limit identity/capacity, request-body bounds, tool-access restrictions and mocked AI provider errors, keys, response limits and deadlines. The consolidated test report is the source for the latest full-suite execution totals; the presence of a test file alone is not a live integration certification.

Live provider reachability, quota/billing, production TLS behavior, MongoDB persistence/audit behavior, reverse-proxy Origin behavior, secrets deployment, distributed rate limiting and egress firewall policy remain unverified. DNS deadlines stop subsequent connection creation but cannot cancel underlying operating-system lookup work. SSL integration was not exercised against real hosts by the deterministic network suite.

Rate-limit buckets, caches and concurrency counters are local to one process. Multiple workers/instances multiply allowances and do not share state. Without RATE_LIMIT_IP_HEADER, callers share a conservative bucket. If configured, the ingress must overwrite that header and prevent clients supplying trusted identity values. A shared store or gateway is required before treating these limits as deployment-wide abuse protection.

## Remaining security work

The 2026-10-13 dependency audit reports **0 critical, 5 high and 3 moderate** findings after compatible updates, official SheetJS 0.20.3 and a scoped image-size 2.0.4 patch. Remaining high findings are the ESLint glob dependency chain; moderate findings are Mammoth's CLI argument formatting chain. They remain recorded rather than suppressed. Review [dependency-audit.json](dependency-audit.json); avoid forced framework downgrades. Browser conversion compatibility is covered by generated Office fixtures.

Image byte/pixel/output-side, PDF byte/page/geometry, Office archive-entry/declared-expansion, slide/sheet/cell/range limits are now implemented. These do not constitute exhaustive parser isolation: malformed archives can falsify metadata, decompression/decoding may allocate before checks, and document work still needs worker isolation and cancellation review. Production verification and distributed abuse controls remain deployment work, rather than properties proven by local tests.
