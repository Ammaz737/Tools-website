# Network output quality verification

Checkpoint: 16 October 2026, Asia/Karachi. Raw UTC timestamps/durations: `network-quality-results.json`.

Actual production GET handlers were invoked directly using real public DNS/TLS/HTTP requests. No mock upstreams, API keys, Atlas connections/writes, emails, or browser server. PASS covers the recorded target and invariants only, not browser interactions or exhaustive provider accuracy.

| Tool | Live result | Verified output |
| --- | --- | --- |
| Website speed test | PASS | example.com HTTP200, page bytes, nonnegative latency, honest server-probe scope |
| Broken link checker | PASS | IANA help/example-domains links discovered and checked, HTTP status ranges, independently recomputed broken count |
| SSL checker | PASS | example.com valid chain/hostname, future expiry, fingerprint |
| WHOIS lookup | PASS | Actual example.com RDAP identity, parseable registration date, nameservers |
| IP lookup | PASS | 1.1.1.1 identity, country, geographic coordinate ranges |
| Currency converter | PASS | Actual USD base, USD=1, positive EUR/PKR, over100 currencies |
| DNS lookup | BLOCKED | Configured DNS resolver refuses queries |
| Email validator | BLOCKED | Same resolver failure prevents MX validation |

The first live run exposed a real transport defect: Node22 requests custom lookup results with all:true, but safeRequest returned the single-address callback format, causing Invalid IP address: undefined. The callback now returns the already validated pinned address in the requested format, with no new lookup or alternate destination. New safe-request-lookup.test.ts exercises both formats and verifies only one resolution. Existing SSRF, timeout, byte-limit, redirect and mocked network-route tests also pass:8 focused tests total. TypeScript also passes.

Independent DNS diagnostics: configured resolver127.0.0.1 returns ECONNREFUSED for resolve4(example.com) and resolveMx(gmail.com), while OS hostname lookup succeeds. No DNS fallback was introduced. Fix the deployment runtime resolver and rerun these checks there.

Reproduce from repository root:

```powershell
node --import tsx scripts/check-network-quality.ts
node --import tsx --test tests/safe-request-lookup.test.ts tests/safe-request.test.ts tests/ssrf.test.ts tests/network-routes.test.ts
```

The script exits nonzero for blocked/failed checks. It clears its own MONGODB_URI before loading handlers and does not load environment files. It writes sanitized outcomes rather than complete upstream payloads. IANA is used for the links fixture because example.com currently contains no hyperlinks. Live page structure/data can change; diagnose future failures before assuming an application defect.

The crawler now uses pinned parse5 8.0.0 to parse quoted/unquoted attributes, HTML entities, relative URLs and the first base href; comments, script text and template content cannot supply fake links. It deduplicates URLs, removes fragments, caps discovery at 20 and checked links at 12, rejects unsafe URL schemes/credentials/local targets, and preserves safeRequest DNS validation for every actual fetch. Tests cover these behaviors. Source: https://github.com/inikulin/parse5/blob/master/README.md

Remaining limits: the crawler checks up to 12 links and does not execute JavaScript. Latency depends on this runtime. IP location is approximate provider data. MX presence does not prove mailbox deliverability. Currency output still needs provider date/attribution acceptance. No claim of perfection or complete production readiness is made.

## Explicit opt-in DNS stage

System DNS remains unchanged and the default check still records 6 PASS / 2 BLOCKED. A separate run explicitly selected DNS_RESOLVER_SERVERS=1.1.1.1 in the checking process and all 8 production route checks passed, including actual example.com DNS records and gmail.com MX records. See network-quality-optin-dns-results.json. This is conditional live evidence, not evidence that the current system DNS configuration works.

The DNS/email routes now support the optional server-only DNS_RESOLVER_SERVERS setting: a comma-separated list of at most four public literal IP addresses. With no setting, system DNS remains in use. Invalid/private addresses are rejected, no silent fallback is made, and timeout/cancellation remain per request. No private .env file or machine DNS setting was changed.

Reproduce the explicit stage:

```powershell
node --import tsx scripts/check-network-quality.ts --explicit-public-dns
```