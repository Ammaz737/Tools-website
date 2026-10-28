/** Live read-only checks; no environment files, credentials, database writes, or mock providers. */
import { writeFile, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";

async function main() {
  // Availability defaults only. Do not connect to a caller's Atlas configuration.
  delete process.env.MONGODB_URI;
  const explicitPublicDns = process.argv.includes("--explicit-public-dns");
  if (explicitPublicDns) process.env.DNS_RESOLVER_SERVERS = "1.1.1.1";
  else delete process.env.DNS_RESOLVER_SERVERS;
  const [{ GET: crawl }, { GET: dns }, { GET: email }, { GET: ssl }, { GET: whois }, { GET: ip }, { GET: rates }] = await Promise.all([
    import("../app/api/crawl/route"), import("../app/api/dns/route"), import("../app/api/email-check/route"),
    import("../app/api/ssl/route"), import("../app/api/whois/route"), import("../app/api/ip/route"), import("../app/api/rates/route"),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- externally supplied JSON receives invariant checks below.
  type Payload = Record<string, any>; // Provider JSON is independently asserted below.
  type Check = { id: string; path: string; handler: (request: NextRequest) => Promise<Response>; verify: (data: Payload) => void };
  const checks: Check[] = [
    { id: "website-speed-test", path: "crawl?url=https://example.com&mode=probe", handler: crawl, verify: d => { assert.equal(d.statusCode, 200); assert.ok(d.pageSizeBytes > 100); assert.ok(d.responseTimeMs >= 0); assert.match(d.note, /not full Lighthouse/); } },
    { id: "broken-link-checker", path: "crawl?url=https://www.iana.org/help/example-domains&mode=links", handler: crawl, verify: d => { assert.ok(d.sampleLinks.length > 0); assert.ok(d.linkResults.length > 0); assert.equal(d.brokenCount, d.linkResults.filter((x: Payload) => !x.ok).length); assert.ok(d.linkResults.every((x: Payload) => x.statusCode >= 100 && x.statusCode <= 599)); } },
    { id: "dns-lookup", path: "dns?domain=example.com", handler: dns, verify: d => { assert.equal(d.domain, "example.com"); assert.ok(d.records.A.length > 0); assert.ok(d.records.NS.length > 0); } },
    { id: "email-validator", path: "email-check?email=readiness-check@gmail.com", handler: email, verify: d => { assert.equal(d.validSyntax, true); assert.equal(d.hasMxRecords, true); assert.ok(d.mxRecords.length > 0); assert.match(d.status, /deliverability is unverified/); } },
    { id: "ssl-checker", path: "ssl?domain=example.com", handler: ssl, verify: d => { assert.equal(d.certificate.valid, true); assert.ok(Date.parse(d.certificate.validTo) > Date.now()); assert.ok(d.certificate.fingerprint); } },
    { id: "whois-lookup", path: "whois?domain=example.com", handler: whois, verify: d => { assert.equal(d.whois.domain.toLowerCase(), "example.com"); assert.ok(Number.isFinite(Date.parse(d.whois.registrationDate))); assert.ok(d.whois.nameservers.length > 0); } },
    { id: "ip-lookup", path: "ip?query=1.1.1.1", handler: ip, verify: d => { assert.equal(d.info.ip, "1.1.1.1"); assert.notEqual(d.info.country, "Unknown"); assert.ok(Math.abs(d.info.latitude) <= 90); assert.ok(Math.abs(d.info.longitude) <= 180); } },
    { id: "currency-converter", path: "rates", handler: rates, verify: d => { assert.equal(d.base, "USD"); assert.equal(d.rates.USD, 1); assert.equal(d.source, "ExchangeRate-API"); assert.ok(Number.isFinite(Date.parse(d.updatedAt))); assert.ok(d.rates.EUR > 0); assert.ok(d.rates.PKR > 0); assert.ok(Object.keys(d.rates).length > 100); } },
  ];
  const results = await Promise.all(checks.map(async c => {
    const start = Date.now();
    try {
      const response = await c.handler(new NextRequest(`http://localhost/api/${c.path}`));
      const data = await response.json();
      if (!response.ok || data.success !== true) return { id: c.id, status: "BLOCKED", httpStatus: response.status, durationMs: Date.now() - start, error: String(data.error || "Upstream unavailable").slice(0, 300) };
      c.verify(data);
      return { id: c.id, status: "PASS", httpStatus: response.status, durationMs: Date.now() - start };
    } catch (error) { return { id: c.id, status: "FAIL", durationMs: Date.now() - start, error: error instanceof Error ? error.message.slice(0, 300) : "Check failed" }; }
  }));
  const evidenceFiles = [
    "package-lock.json", "app/api/crawl/route.ts", "app/api/dns/route.ts",
    "app/api/email-check/route.ts", "app/api/ssl/route.ts", "app/api/whois/route.ts",
    "app/api/ip/route.ts", "app/api/rates/route.ts", "lib/server/safe-request.ts",
    "lib/server/ssrf.ts", "lib/server/html-links.ts", "lib/server/dns-resolver.ts",
    "lib/server/rate-limit.ts", "lib/server/tool-access.ts", "lib/server/cache.ts",
    "lib/tool-status.ts", "lib/db.ts", "lib/tools.ts",
  ];
  const sourceHashes = Object.fromEntries(await Promise.all(evidenceFiles.map(async file => [file, createHash("sha256").update(await readFile(file)).digest("hex")])));

  const report = { sourceHashes, dnsMode: explicitPublicDns ? "Explicit opt-in Cloudflare 1.1.1.1" : "System resolver (no override)", checkedAt: new Date().toISOString(), scope: "Actual production GET handlers with live read-only public requests; defaults only, no Atlas connection. A pass covers these targets and invariants, not UI behavior or exhaustive provider accuracy.", results };
  await writeFile(explicitPublicDns ? "docs/network-quality-optin-dns-results.json" : "docs/network-quality-results.json", JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  if (results.some(r => r.status !== "PASS")) process.exitCode = 1;
}
void main();
