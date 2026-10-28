import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import dns from "node:dns/promises";
import https from "node:https";
import { EventEmitter } from "node:events";
test("rates reject stale publication and retain timestamp/attribution through cache", async t => {
  delete process.env.MONGODB_URI;
  t.mock.method(dns, "lookup", async () => [{ address: "1.1.1.1", family: 4 }]);
  const now = Math.floor(Date.now() / 1000);
  let timestamp = now - 4 * 86400, calls = 0;
  t.mock.method(https, "request", (_url: URL, _options: https.RequestOptions, callback: (response: EventEmitter) => void) => {
    const outgoing = new EventEmitter() as EventEmitter & { end(): void };
    outgoing.end = () => queueMicrotask(() => {
      calls++;
      const response = Object.assign(new EventEmitter(), { statusCode: 200, headers: {} });
      callback(response);
      response.emit("data", Buffer.from(JSON.stringify({ result: "success", base_code: "USD", time_last_update_unix: timestamp, time_next_update_unix: timestamp + 86400, rates: { USD: 1, EUR: 0.9 } })));
      response.emit("end");
    });
    return outgoing;
  });
  const { GET } = await import("../app/api/rates/route");
  const request = () => new NextRequest("http://localhost/api/rates");
  assert.equal((await GET(request())).status, 502);
  timestamp = now;
  const first = await (await GET(request())).json();
  assert.equal(first.updatedAt, new Date(now * 1000).toISOString());
  assert.equal(first.source, "ExchangeRate-API");
  assert.equal(first.cached, false);
  timestamp = 0;
  const cached = await (await GET(request())).json();
  assert.equal(cached.cached, true);
  assert.equal(cached.updatedAt, first.updatedAt);
  assert.equal(cached.source, first.source);
  assert.equal(calls, 2);
});
