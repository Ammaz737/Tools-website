import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const metadata = JSON.parse(await readFile("node_modules/libheif-js/package.json", "utf8"));
if (metadata.version !== "1.23.5") throw new Error("Review HEIC assets before changing the pinned decoder.");
await mkdir("public/codecs/heic", { recursive: true });
await copyFile("node_modules/libheif-js/libheif-wasm/libheif-bundle.js", "public/codecs/heic/libheif-bundle.js");
await copyFile("node_modules/libheif-js/libheif-wasm/LICENSE", "public/codecs/heic/LICENSE");
const files = {};
for (const name of ["libheif-bundle.js", "decode-worker.js", "LICENSE"]) {
  const bytes = await readFile("public/codecs/heic/" + name);
  files[name] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
await writeFile("public/codecs/heic/manifest.json", JSON.stringify({ version: metadata.version, files }, null, 2) + "\n");
console.log("Prepared pinned local HEIC decoder assets.");
