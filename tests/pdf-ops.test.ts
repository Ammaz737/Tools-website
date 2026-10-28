import assert from "node:assert/strict";
import test from "node:test";
import { parsePageSelection } from "../lib/pdf-ops";

test("page selection expands ranges to zero-based indices in requested order", () => {
  assert.deepEqual(parsePageSelection("1-3, 5, 8-9", 10), [0, 1, 2, 4, 7, 8]);
  assert.deepEqual(parsePageSelection("5, 1-3", 5), [4, 0, 1, 2]);
});

test("page selection handles reversed ranges and removes duplicates", () => {
  assert.deepEqual(parsePageSelection("4-2, 3, 1, 4", 5), [1, 2, 3, 0]);
});

test("page selection ignores out-of-bounds pages, blanks, and nonnumeric tokens", () => {
  assert.deepEqual(parsePageSelection("0, 1-5, 8, unknown, ,", 3), [0, 1, 2]);
  assert.deepEqual(parsePageSelection("", 3), []);
  assert.deepEqual(parsePageSelection("1-3", 0), []);
});
