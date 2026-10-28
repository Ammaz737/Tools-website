import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import dns, { Resolver } from "node:dns/promises";
import https from "node:https";
import { EventEmitter } from "node:events";

test("network routes reject malformed input and report mocked provider results honestly", async (t) => {
  delete process.env.MONGODB_URI;
  const ip = await import("../app/api/ip/route");
  const email = await import("../app/api/email-check/route");
  const whois = await import("../app/api/whois/route");
  const rates = await import("../app/api/rates/route");
  const request = (query: string) => new NextRequest(`http://localhost/api/test?${query}`);
  for (const value of ["", "example.com/path", "127.0.0.1", "https://example.com"]) assert.equal((await ip.GET(request(`query=${encodeURIComponent(value)}`))).status, 400);
  for (const value of ["a@@example.com", ".a@example.com", "a..b@example.com", "a@-bad.com", "a@example.com/evil"]) assert.equal((await email.GET(request(`email=${encodeURIComponent(value)}`))).status, 400);
  t.mock.method(Resolver.prototype, "resolveMx", async () => { throw Object.assign(new Error("absent"), { code: "ENODATA" }); });
  const missingMx = await (await email.GET(request("email=a%40example.com"))).json();
  assert.equal(missingMx.success, true);
  assert.equal(missingMx.hasMxRecords, false);
  assert.match(missingMx.status, /unverified/);
  t.mock.method(Resolver.prototype, "resolveMx", async () => { throw Object.assign(new Error("timeout"), { code: "ETIMEOUT" }); });
  assert.equal((await email.GET(request("email=b%40example.com"))).status, 502);
  t.mock.method(dns, "lookup", async () => [{ address: "8.8.8.8", family: 4 }]);
  let payload = "not json";
  let status = 200;
  let timedOut = false;
  t.mock.method(https, "request", (_url: URL, _options: https.RequestOptions, callback: (response: EventEmitter) => void) => {
    const outgoing = new EventEmitter() as EventEmitter & { end(): void };
    outgoing.end = () => queueMicrotask(() => {
      if (timedOut) { outgoing.emit("error", new Error("Request timed out")); return; }
      const response = Object.assign(new EventEmitter(), { statusCode: status, headers: {} });
      callback(response);
      response.emit("data", Buffer.from(payload));
      response.emit("end");
    });
    return outgoing;
  });
  assert.equal((await rates.GET(request(""))).status, 502);
  payload = JSON.stringify({ result: "success", base_code: "USD", rates: { USD: 1, EUR: -1 } });
  assert.equal((await rates.GET(request(""))).status, 502);
  status = 404;
  const failedWhois = await whois.GET(request("domain=example.com"));
  assert.equal(failedWhois.status, 404);
  assert.equal((await failedWhois.json()).success, false);
  status = 200;
  payload = JSON.stringify({ error: true, reason: "provider diagnostic secret" });
  const failedIp = await ip.GET(request("query=8.8.8.8"));
  assert.equal(failedIp.status, 502);
  assert.doesNotMatch(await failedIp.text(), /diagnostic secret/);
  timedOut = true;
  assert.equal((await rates.GET(request(""))).status, 502);
});
