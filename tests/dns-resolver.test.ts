import test from "node:test";
import assert from "node:assert/strict";
import { Resolver } from "node:dns/promises";
import { createNetworkResolver } from "../lib/server/dns-resolver";

test("DNS resolver override is opt-in, public literal addresses only, and bounded", t => {
  const previous = process.env.DNS_RESOLVER_SERVERS;
  t.after(() => { if (previous === undefined) delete process.env.DNS_RESOLVER_SERVERS; else process.env.DNS_RESOLVER_SERVERS = previous; });
  let calls = 0;
  t.mock.method(Resolver.prototype, "setServers", (servers: string[]) => { calls++; assert.deepEqual(servers, ["1.1.1.1", "2606:4700:4700::1111"]); });
  delete process.env.DNS_RESOLVER_SERVERS;
  createNetworkResolver(3000).cancel(); assert.equal(calls, 0);
  process.env.DNS_RESOLVER_SERVERS = "1.1.1.1, 2606:4700:4700::1111";
  createNetworkResolver(3000).cancel(); assert.equal(calls, 1);
  for (const invalid of ["127.0.0.1", "192.168.1.1", "::1", "resolver.example", "1.1.1.1:53", "1.1.1.1,", "1.1.1.1,1.1.1.1,1.1.1.1,1.1.1.1,1.1.1.1"]) {
    process.env.DNS_RESOLVER_SERVERS = invalid;
    assert.throws(() => createNetworkResolver(3000), /configuration is invalid/);
  }
  assert.equal(calls, 1);
});
