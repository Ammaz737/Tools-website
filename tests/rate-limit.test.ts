import assert from "node:assert/strict";
import test from "node:test";
import { createRateLimiter, rateLimitIdentity } from "../lib/server/rate-limit";

test("quota blocks over-limit requests and resets at the window boundary", () => {
  const consume = createRateLimiter();
  assert.equal(consume("a", 2, 60_000, 0).allowed, true);
  assert.equal(consume("a", 2, 60_000, 1).allowed, true);
  assert.deepEqual(consume("a", 2, 60_000, 30_000), { allowed: false, retryAfter: 30 });
  assert.equal(consume("a", 2, 60_000, 60_000).allowed, true);
});

test("identities have separate quotas and full storage does not evict active quotas", () => {
  const consume = createRateLimiter(2);
  assert.equal(consume("a", 1, 60_000, 0).allowed, true);
  assert.equal(consume("b", 1, 60_000, 0).allowed, true);
  assert.equal(consume("c", 1, 60_000, 1).allowed, false);
  assert.equal(consume("a", 1, 60_000, 2).allowed, false);
  assert.equal(consume("c", 1, 60_000, 60_000).allowed, true);
});

test("untrusted forwarded headers cannot mint new identities", () => {
  const previous = process.env.RATE_LIMIT_IP_HEADER;
  try {
    delete process.env.RATE_LIMIT_IP_HEADER;
    assert.equal(rateLimitIdentity(new Headers({ "x-forwarded-for": "1.1.1.1" })), "shared");
    process.env.RATE_LIMIT_IP_HEADER = "x-real-ip";
    assert.equal(rateLimitIdentity(new Headers({ "x-real-ip": "1.1.1.1" })), "1.1.1.1");
    assert.equal(rateLimitIdentity(new Headers({ "x-real-ip": "::1" })), "::1");
    assert.equal(rateLimitIdentity(new Headers({ "x-real-ip": "1.1.1.1, 2.2.2.2" })), "shared");
  } finally {
    if (previous === undefined) delete process.env.RATE_LIMIT_IP_HEADER;
    else process.env.RATE_LIMIT_IP_HEADER = previous;
  }
});
