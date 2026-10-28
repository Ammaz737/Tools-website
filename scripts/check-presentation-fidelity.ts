import PptxGenJS from "pptxgenjs";
import { PDFDocument } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import { convertPptxToPdf } from "../lib/office-client";

// Acceptance probe kept separate from unit tests: this represents expected
// user-facing slide behavior, and intentionally exits nonzero while broken.
async function main() {
  const directory = "docs/quality-evidence/powerpoint-to-pdf";
  await mkdir(directory, { recursive: true });
  const presentation = new PptxGenJS();
  presentation.layout = "LAYOUT_WIDE";
  const slide = presentation.addSlide();
  slide.addText("Both images and this heading must remain on ONE slide", { x: 1, y: 0.5, w: 10, h: 1 });
  const png = "image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
  slide.addImage({ data: png, x: 1, y: 2, w: 2, h: 2 });
  slide.addImage({ data: png, x: 5, y: 2, w: 2, h: 2 });
  const bytes = await presentation.write({ outputType: "arraybuffer" }) as ArrayBuffer;
  await writeFile(`${directory}/source-one-slide.pptx`, new Uint8Array(bytes));
  let output: Blob;
  try {
    output = await convertPptxToPdf(new File([bytes], "source.pptx"));
  } catch (error) {
    const result = { status: "BLOCKED_UNSUPPORTED_LAYOUT", expectedPages: 1, actualPages: 0,
      message: error instanceof Error ? error.message : "Conversion failed", corruptDownloadPrevented: true };
    await writeFile(`${directory}/result.json`, JSON.stringify(result, null, 2) + "\n");
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }
  await writeFile(`${directory}/actual.pdf`, new Uint8Array(await output.arrayBuffer()));
  const pdf = await PDFDocument.load(await output.arrayBuffer());
  const result = {
    status: pdf.getPageCount() === 1 ? "REQUIRES_VISUAL_REVIEW" : "FAIL",
    expectedPages: 1,
    actualPages: pdf.getPageCount(),
    actualSizes: pdf.getPages().map(page => page.getSize()),
    expectedBehavior: "One slide remains one landscape PDF page, with both placed images and heading visible.",
    finding: "Current image-first converter emits one page per embedded image and omits accompanying text. Arbitrary slide rendering is not implemented.",
  };
  await writeFile(`${directory}/result.json`, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
  if (result.status === "FAIL") process.exitCode = 1;
}
void main();
