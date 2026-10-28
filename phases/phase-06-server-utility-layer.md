# Phase 06 - Server Utility Layer

This phase adds only the server-backed tools that cannot reasonably run as pure browser tools.

## Objective

Keep server computation small, controlled, and isolated to unavoidable cases.

## Scope

- currency rates
- DNS lookup
- WHOIS
- SSL check
- IP lookup
- MX validation
- broken link crawling
- speed testing
- sitemap crawl mode

## Recommended Batch Order

### Batch 06A - Secure Server Foundations

- Input validation
- request size limits
- rate limiting
- caching
- timeout rules
- SSRF protections

### Batch 06B - Currency And Simple Fetch Services

- `GET /api/rates`
- currency tool integration

### Batch 06C - Network Lookup Tools

- `dns-lookup`
- `whois-lookup`
- `ssl-checker`
- `ip-lookup`
- `email-validator` server-backed checks

### Batch 06D - SEO Crawl Tools

- `broken-link-checker`
- `website-speed-test`
- server mode for `sitemap-generator`
- server mode for `keyword-density-checker` URL fetches

## Shared Rules

- Keep these routes thin and defensive
- Cache repeatable results
- Reject internal or unsafe targets
- Fail clearly instead of hanging

## UI Guardrails

- Server-backed tools should look consistent with client tools, not like a separate product
- Latency-sensitive pages must communicate waiting and failure states clearly
- Diagnostic outputs should remain structured, readable, and monospace where useful
- Trust messaging should explain what is fetched server-side and why
- Network tools should prioritize clarity over decorative presentation

## Exit Criteria

- Server tools are safe, validated, and operational
- Infrastructure remains a support layer, not the center of the product
- Server costs stay limited to genuine backend needs

## Risks To Avoid

- Treating the Next.js server like an unlimited compute box
- Skipping SSRF protection for lookup and crawl routes
- Letting a single slow external provider block the whole request path
