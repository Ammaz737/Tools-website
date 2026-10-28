import { copyFile, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
for (const packageName of ["tesseract.js", "tesseract.js-core"]) {
  const metadata = JSON.parse(await readFile(new URL(`node_modules/${packageName}/package.json`, root), "utf8"));
  if (metadata.version !== "5.1.1") throw new Error(`Review OCR assets before upgrading ${packageName}. Expected 5.1.1.`);
}
const copies = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["tesseract.js/LICENSE.md", "TESSERACT_JS_LICENSE"],
  ["tesseract.js-core/LICENSE", "TESSERACT_CORE_LICENSE"],
  ...["tesseract-core-lstm.wasm", "tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm", "tesseract-core-simd-lstm.wasm.js"].map((name) => [`tesseract.js-core/${name}`, name]),
];
for (const [source, target] of copies) {
  const sourceUrl = new URL(`node_modules/${source}`, root);
  const targetUrl = new URL(`public/ocr/${target}`, root);
  const expected = await readFile(sourceUrl);
  let current;
  try { current = await readFile(targetUrl); } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (!current?.equals(expected)) await copyFile(sourceUrl, targetUrl);
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const english = await readFile(new URL("public/ocr/eng.traineddata", root));
if (hash(english) !== "7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2") throw new Error("English traineddata checksum mismatch.");
const manifest = {};
for (const name of [...copies.map(([, target]) => target), "eng.traineddata", "TESSDATA_LICENSE", "worker-entry.js"]) {
  const bytes = await readFile(new URL(`public/ocr/${name}`, root)); manifest[name] = { bytes: bytes.length, sha256: hash(bytes) };
}
await writeFile(new URL("public/ocr/manifest.json", root), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Verified self-hosted OCR assets in ${fileURLToPath(new URL("public/ocr", root))}`);
