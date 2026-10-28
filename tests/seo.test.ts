import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { tools } from "../lib/tools";
import { isImplementedTool } from "../lib/tool-capabilities";
import { buildToolMetadata, isToolIndexable } from "../lib/seo";
import { generateToolJsonLd } from "../lib/jsonld";
import { siteOrigin } from "../lib/site-config";

test("availability policy exactly matches actual dispatcher wiring", () => {
  const source = readFileSync(new URL("../tools/index.tsx", import.meta.url), "utf8");
  const wired = new Set([...source.matchAll(/case\s+"([^"]+)"/g)].map((m) => m[1]));
  for (const tool of tools) assert.equal(isImplementedTool(tool.id), wired.has(tool.id), tool.id);
});
test("unfinished and intentionally unavailable tools have noindex metadata", () => {
  for (const id of ["plagiarism-checker"]) {
    const tool = tools.find((tool) => tool.id === id)!;
    assert.equal(isToolIndexable(tool), false);
    assert.deepEqual(buildToolMetadata(tool).robots, { index: false, follow: true });
  }
  assert.equal(isToolIndexable(tools.find((tool) => tool.id === "merge-pdf")!), true);
});
test("origin normalization and document URLs do not use example domains", () => {
  assert.equal(siteOrigin("https://workshop.test/"), "https://workshop.test");
  for (const bad of ["file:///tmp", "https://user:pass@workshop.test", "https://workshop.test/path", "https://workshop.test/?secret=x"]) assert.throws(() => siteOrigin(bad));
  const tool = tools.find((tool) => tool.id === "merge-pdf")!;
  assert.equal(generateToolJsonLd(tool, "https://workshop.test").url, "https://workshop.test/tools/merge-pdf");
});


test("AI indexing requires shared quota storage as well as a provider", () => {
  const names = ["AI_PROVIDER", "OPENAI_API_KEY", "MONGODB_URI"];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    process.env.AI_PROVIDER = "openai"; process.env.OPENAI_API_KEY = "private-fixture-key";
    const tool = tools.find(tool => tool.id === "ai-writer")!;
    process.env.MONGODB_URI = ""; assert.equal(isToolIndexable(tool), false);
    process.env.MONGODB_URI = "mongodb+srv://<username>:<password>@example.net"; assert.equal(isToolIndexable(tool), false);
    process.env.MONGODB_URI = "mongodb+srv://fixture:fixture@cluster.example.net/database"; assert.equal(isToolIndexable(tool), true);
  } finally { for (const name of names) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; } }
});
