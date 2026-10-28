import assert from "node:assert/strict";
import test from "node:test";
import { readJsonBody } from "../lib/server/request-body";
const request = (body: string) => new Request("https://workshop.test", { method: "POST", body });
test("JSON request reader accepts bounded objects and rejects malformed or non-object values", async () => {
  assert.deepEqual(await readJsonBody(request('{"ok":true}')), { ok: true });
  for (const body of ["{", "null", "[]", '"string"']) await assert.rejects(readJsonBody(request(body)), /JSON/);
});
test("JSON request limits measure bytes without trusting declared length", async () => {
  await assert.rejects(readJsonBody(request('{"text":"ééé"}'), 10), /size limit/);
  await assert.rejects(readJsonBody(new Request("https://workshop.test", { method: "POST", body: "{}", headers: { "content-length": "1000" } }), 10), /size limit/);
});
test("stalled JSON streams time out and are cancelled", async () => {
  let cancelled = false;
  const body = new ReadableStream({ cancel() { cancelled = true; } });
  const req = new Request("https://workshop.test", { method: "POST", body, duplex: "half" } as RequestInit);
  await assert.rejects(readJsonBody(req, 100, 10), /timed out/);
  assert.equal(cancelled, true);
});
