import JSZip from "jszip";
import { readFileSync, writeFileSync } from "fs";
import { PDFDocument } from "pdf-lib";

const pptxPath = "C:/Users/Ammaz/Downloads/Rehan_Ali_Resume (1).pptx";
const zip = await JSZip.loadAsync(readFileSync(pptxPath));
const slideFiles = Object.keys(zip.files)
  .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const out = await PDFDocument.create();
for (const slidePath of slideFiles) {
  const relPath = `ppt/slides/_rels/${slidePath.split("/").pop()}.rels`;
  const relXml = await zip.file(relPath).async("string");
  const targets = [...relXml.matchAll(/Target="([^"]+)"/g)].map((m) => m[1]);
  for (const target of targets) {
    if (!/\.png$/i.test(target)) continue;
    const resolved = `ppt/${target.replace(/^\.\.\//, "")}`;
    const bytes = new Uint8Array(await zip.file(resolved).async("arraybuffer"));
    const img = await out.embedPng(bytes);
    const page = out.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
}
const saved = await out.save();
writeFileSync("C:/Users/Ammaz/Downloads/Rehan_Ali_Resume-FIXED-test.pdf", saved);
console.log("pages", out.getPageCount(), "bytes", saved.length);
