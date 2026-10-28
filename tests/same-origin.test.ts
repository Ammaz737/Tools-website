import test from "node:test";
import assert from "node:assert/strict";
import { isSameOriginRequest } from "../lib/server/same-origin";

test("same-origin handles normalized bind host without trusting forwarded headers", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  try {
    const check = (origin: string, extra = {}) => isSameOriginRequest(new Request("http://localhost:3100/api/admin/logout", { headers: { host: "127.0.0.1:3100", origin, ...extra } }));
    assert.equal(check("http://127.0.0.1:3100"), true);
    for (const origin of ["null", "https://evil.test", "http://127.0.0.1:3100/", "https://127.0.0.1:3100", "http://localhost:3100"]) assert.equal(check(origin), false);
    assert.equal(check("https://evil.test", { "x-forwarded-host": "evil.test", "x-forwarded-proto": "https" }), false);
    process.env.NEXT_PUBLIC_SITE_URL = "https://workshop.test";
    assert.equal(check("https://workshop.test"), true);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
