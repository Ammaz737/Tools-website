import JSZip from "jszip";
import { readFileSync } from "fs";

const pptxPath = "C:/Users/Ammaz/Downloads/Rehan_Ali_Resume (1).pptx";
const zip = await JSZip.loadAsync(readFileSync(pptxPath));
const names = Object.keys(zip.files).sort();
console.log("entries", names.length);
console.log(names.filter((n) => /slide|media|image/i.test(n)).join("\n"));

const slides = names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n));
for (const s of slides) {
  const xml = await zip.file(s).async("string");
  const texts = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)]
    .map((m) => m[1])
    .filter(Boolean);
  const relPath = "ppt/slides/_rels/" + s.split("/").pop() + ".rels";
  const relXml = zip.file(relPath) ? await zip.file(relPath).async("string") : "";
  const images = [...relXml.matchAll(/Target="([^"]+)"/g)].map((m) => m[1]);
  console.log("---", s);
  console.log("  texts", texts.length, texts.slice(0, 5));
  console.log("  rels", images);
}
console.log(
  "media",
  names.filter((n) => n.startsWith("ppt/media/")),
);

const emptyPdf = readFileSync("C:/Users/Ammaz/Downloads/Rehan_Ali_Resume (1) (1).pdf");
console.log("output pdf bytes", emptyPdf.length);
