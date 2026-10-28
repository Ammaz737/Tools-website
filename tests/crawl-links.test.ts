import test from "node:test";
import assert from "node:assert/strict";
import { extractPublicHtmlLinks } from "../lib/server/html-links";

test("crawler parses HTML syntax/entities/base and skips inert or unsafe links", () => {
  const html = `<!-- <a href="https://comment.example/"> -->
  <script>const fake = '<a href="https://script.example/">';</script>
  <template><a href=https://template.example/></template>
  <base href=/docs/><base href=https://ignored.example/>
  <A HREF=guide?x=1&amp;y=2>Unquoted</A><a href = 'guide?x=1&amp;y=2#anchor'>Duplicate</a>
  <area href=../image-map><link href="/style.css">
  <a href=javascript:alert(1)>Unsafe</a><a href=mailto:a@example.com>Mail</a>
  <a href=http://127.0.0.1/>Private</a><a href=https://user:pass@example.com/>Credentials</a>
  <a href=#fragment>Fragment</a><a href="">Empty</a>`;
  assert.deepEqual(extractPublicHtmlLinks(html, "https://example.com/start"), [
    "https://example.com/docs/guide?x=1&y=2", "https://example.com/image-map", "https://example.com/style.css",
  ]);
});

test("crawler canonicalizes, deduplicates, bounds and handles malformed documents", () => {
  const html = Array.from({length: 40}, (_, i) => `<a href=/page${i}>`).join("");
  assert.equal(extractPublicHtmlLinks(html, "https://example.com", 100).length, 20);
  assert.equal(extractPublicHtmlLinks(html, "https://example.com", 2).length, 2);
  assert.deepEqual(extractPublicHtmlLinks(html, "https://example.com", 0), []);
  assert.deepEqual(extractPublicHtmlLinks('<a href="//EXAMPLE.com:443/path#x"><a href=/path#y>', "https://example.com"), ["https://example.com/path"]);
  assert.deepEqual(extractPublicHtmlLinks('<base href=http://localhost/><a href=/private><a href=https://example.com/public>', "https://example.com"), ["https://example.com/public"]);
});
