import assert from "node:assert/strict";
import test from "node:test";
import http from "node:http";
import { EventEmitter } from "node:events";
import { safeRequest } from "../lib/server/safe-request";

test("pinned lookup supports Node autoSelectFamily all:true without resolving again", async t => {
  let resolutions = 0;
  t.mock.method(http, "request", (_url: URL, options: http.RequestOptions, consume: (incoming: EventEmitter) => void) => {
    const lookup = options.lookup as (host: string, options: { all: boolean }, callback: (error: null, address: unknown, family?: number) => void) => void;
    lookup("example.com", { all: true }, (error, addresses) => {
      assert.equal(error, null); assert.deepEqual(addresses, [{ address: "8.8.8.8", family: 4 }]);
    });
    lookup("example.com", { all: false }, (error, address, family) => {
      assert.equal(error, null); assert.equal(address, "8.8.8.8"); assert.equal(family, 4);
    });
    return Object.assign(new EventEmitter(), { end() {
      queueMicrotask(() => {
        const incoming = Object.assign(new EventEmitter(), { statusCode: 200, headers: {} });
        consume(incoming); incoming.emit("data", Buffer.from("ok")); incoming.emit("end");
      });
    } });
  });
  const response = await safeRequest("http://example.com", { resolver: async () => {
    resolutions++; return [{ address: "8.8.8.8", family: 4 }, { address: "1.1.1.1", family: 4 }];
  } });
  assert.equal(response.body.toString(), "ok"); assert.equal(resolutions, 1);
});
