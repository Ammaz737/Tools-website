import { test, expect, type Page } from "@playwright/test";

// Mocked browser/API contracts only. Actual public-provider checks are recorded
// separately in docs/network-quality-results.json and the opt-in DNS report.
async function recoverableApi(page: Page, endpoint: string, queryKey: string, expectedQuery: string, payload: object) {
  let requests = 0;
  await page.route(`**/api/${endpoint}*`, async route => {
    const url = new URL(route.request().url());
    // An older IP UI sends a blank request on mount; do not mistake it for the
    // explicit user action under test.
    if (endpoint === "ip" && !url.searchParams.has("query")) {
      await route.fulfill({ status: 400, json: { success: false, error: "Enter a public IP address or domain" } });
      return;
    }
    expect(url.searchParams.get(queryKey)).toBe(expectedQuery);
    if (endpoint === "crawl") expect(url.searchParams.get("mode")).toBe("links" in payload ? "links" : null);
    requests++;
    await route.fulfill(requests === 1
      ? { status: 502, json: { success: false, error: "Fixture service temporarily unavailable" } }
      : { json: { success: true, ...payload } });
  });
  return () => requests;
}

const examples = [
  { id: "dns-lookup", endpoint: "dns", key: "domain", value: "example.com", input: "Domain Name / Hostname", button: "Lookup DNS", payload: { domain: "example.com", records: { A: ["93.184.215.14"], MX: [{ exchange: "mx.example.com", priority: 10 }], CNAME: [] } }, expected: ["93.184.215.14", "mx.example.com", "No records found"] },
  { id: "whois-lookup", endpoint: "whois", key: "domain", value: "example.com", input: "Domain Name", button: "Query WHOIS", payload: { domain: "example.com", whois: { domain: "EXAMPLE.COM", registrationDate: "1995-08-14T04:00:00Z", nameservers: ["a.iana-servers.net", "b.iana-servers.net"] } }, expected: ["EXAMPLE.COM", "1995-08-14T04:00:00Z", "a.iana-servers.net, b.iana-servers.net"] },
  { id: "ssl-checker", endpoint: "ssl", key: "domain", value: "example.com", input: "Domain / Hostname", button: "Inspect SSL", payload: { domain: "example.com", certificate: { valid: false, daysRemaining: 0, subject: "example.com", issuer: "Fixture Issuer", validFrom: "2020-01-01", validTo: "2021-01-01", fingerprint: "AA:BB:CC" } }, expected: ["EXPIRED / INVALID", "0 days remaining", "AA:BB:CC"] },
  { id: "ip-lookup", endpoint: "ip", key: "query", value: "1.1.1.1", input: "IP Address or Hostname", button: "Lookup IP", payload: { info: { ip: "1.1.1.1", country: "Australia", countryCode: "AU", city: "Sydney", region: "New South Wales", org: "Fixture Network", timezone: "Australia/Sydney" } }, expected: ["Australia (AU)", "Sydney, New South Wales", "Fixture Network", "TZ: Australia/Sydney"] },
  { id: "email-validator", endpoint: "email-check", key: "email", value: "qa+contract@example.com", input: "Email Address to Validate", button: "Validate Email", payload: { email: "qa+contract@example.com", domain: "example.com", validSyntax: true, hasMxRecords: true, mxRecords: [{ exchange: "mx.example.com", priority: 10 }], status: "Mail routing records found; mailbox deliverability is unverified" }, expected: ["Mail routing records found; mailbox deliverability is unverified", "mx.example.com", "Yes ✓"] },
  { id: "broken-link-checker", endpoint: "crawl", key: "url", value: "https://example.com/a?x=1&y=2", input: "Target URL to Crawl", button: "Crawl Links", payload: { links: true, url: "https://example.com/a?x=1&y=2", statusCode: 200, statusText: "OK", responseTimeMs: 37, brokenCount: 1, linkResults: [{ url: "https://example.com/good", statusCode: 200, ok: true, statusText: "OK" }, { url: "https://example.com/missing", statusCode: 404, ok: false, statusText: "Not Found" }] }, expected: ["Link status (1 broken)", "https://example.com/good", "https://example.com/missing", "404"] },
  { id: "website-speed-test", endpoint: "crawl", key: "url", value: "https://example.com/a?x=1&y=2", input: "Target URL for Latency Check", button: "Test Speed", payload: { url: "https://example.com/a?x=1&y=2", statusCode: 200, statusText: "OK", responseTimeMs: 125, pageSizeBytes: 2560, headers: { "content-type": "text/html", "cache-control": "max-age=60" } }, expected: ["125 ms", "2.5 KB", "max-age=60"] },
] as const;

for (const item of examples) test(`${item.id}: mocked UI query, output and upstream-error recovery`, async ({ page }) => {
  const count = await recoverableApi(page, item.endpoint, item.key, item.value, item.payload);
  await page.goto(`/tools/${item.id}`);
  await page.getByLabel(item.input, { exact: item.id !== "ip-lookup" }).fill(item.value);
  const button = page.getByRole("button", { name: item.button, exact: true });
  await button.click();
  await expect(page.getByText("⚠️ Fixture service temporarily unavailable", { exact: true })).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();
  for (const text of item.expected) await expect(page.getByText(text, { exact: !["93.184.215.14", "mx.example.com", "AA:BB:CC", "Yes ✓", "max-age=60"].includes(text) }).first()).toBeVisible();
  await expect(page.getByText("⚠️ Fixture service temporarily unavailable", { exact: true })).toHaveCount(0);
  expect(count()).toBe(2);
  await page.getByLabel(item.input, { exact: item.id !== "ip-lookup" }).fill("");
  await expect(page.getByText(item.expected[0], { exact: !["93.184.215.14"].includes(item.expected[0]) }).first()).toHaveCount(0);
  await button.click();
  await expect(page.locator("p[role=alert]")).toContainText(item.id === "ip-lookup" ? "public IP" : "Enter a value");
  expect(count()).toBe(2);
});

test("currency-converter: mocked exchange rates yield correct cross-rate math and recover after failure", async ({ page }) => {
  let unavailable = true;
  let calls = 0;
  await page.route("**/api/rates", async route => {
    expect(new URL(route.request().url()).search).toBe(""); calls++;
    await route.fulfill(unavailable ? { status: 502, json: { success: false, error: "Exchange rates unavailable" } }
      : { json: { success: true, base: "USD", rates: { USD: 1, EUR: 0.8, GBP: 0.5, PKR: 280 } } });
  });
  await page.goto("/tools/currency-converter");
  await expect(page.getByText("Exchange rates unavailable", { exact: true })).toBeVisible();
  unavailable = false;
  await page.getByRole("button", { name: "Retry exchange rates", exact: true }).click();
  await expect(page.getByText("80.00 EUR", { exact: true })).toBeVisible();
  await page.getByLabel("Amount", { exact: true }).fill("12.50");
  await page.getByLabel("From Currency", { exact: true }).selectOption("GBP");
  await page.getByLabel("To Currency", { exact: true }).selectOption("PKR");
  await expect(page.getByText("7000.00 PKR", { exact: true })).toBeVisible();
  await expect(page.getByText("1 GBP = 560.0000 PKR", { exact: true })).toBeVisible();
  await page.getByLabel("Amount", { exact: true }).fill("");
  await expect(page.locator("p[role=alert]")).toContainText("finite amount");
  await expect(page.getByText("7000.00 PKR", { exact: true })).toHaveCount(0);
  await page.getByLabel("Amount", { exact: true }).fill("0");
  await expect(page.getByText("0.00 PKR", { exact: true })).toBeVisible();
  expect(calls).toBe(2);
});
