import assert from "node:assert/strict";
import test from "node:test";
import { validateToolConfig } from "../lib/tool-status";
test("tool configuration accepts only supported bounded values", () => {
  assert.deepEqual(validateToolConfig({ isActive: false, maintenance: true, maxInputChars: 1000, maxFileSizeMB: 10, timeoutMs: 2000 }), { isActive: false, maintenance: true, maxInputChars: 1000, maxFileSizeMB: 10, timeoutMs: 2000 });
  for (const value of [null, [], {}, { maintenance: "true" }, { maxInputChars: 0 }, { maxInputChars: 1000001 }, { maxFileSizeMB: 101 }, { timeoutMs: 999 }, { timeoutMs: Infinity }, { dailyQuota: 5 }, { premium: true }, { maxInputChars: 2.5 }]) assert.throws(() => validateToolConfig(value));
});
