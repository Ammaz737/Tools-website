import assert from "node:assert/strict";
import test from "node:test";
import { requireToolAccess } from "../lib/server/tool-access";
import type { ToolStatus } from "../lib/tool-status";
const base: ToolStatus = { toolId: "test", isActive: true, maintenance: false, usageCount: 0, updatedAt: new Date(0), maxInputChars: 10, maxFileSizeMB: 1 };
test("tool access rejects unknown, disabled, maintenance and database outage", async () => {
  for (const [value, code] of [[null, 404], [{ ...base, isActive: false }, 403], [{ ...base, maintenance: true }, 503]] as const) {
    const result = await requireToolAccess("test", {}, async () => value);
    assert.ok("response" in result); assert.equal(result.response.status, code);
  }
  const result = await requireToolAccess("test", {}, async () => { throw new Error("secret database error"); });
  assert.ok("response" in result); assert.equal(result.response.status, 503);
  assert.ok(!(await result.response.text()).includes("secret"));
});
test("configured input limits include boundary and oversized file checks", async () => {
  assert.ok("status" in await requireToolAccess("test", { inputChars: 10, fileSizeBytes: 1048576 }, async () => base));
  for (const options of [{ inputChars: 11 }, { fileSizeBytes: 1048577 }]) {
    const result = await requireToolAccess("test", options, async () => base);
    assert.ok("response" in result); assert.equal(result.response.status, 413);
  }
});
