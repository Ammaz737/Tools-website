import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import {
  buildDocxFromPageTexts,
  buildDocxFromPdfPages,
  buildDocxFromText,
} from "../lib/docx-from-text";
import { convertOfficeFile, convertPptxToPdf } from "../lib/office-client";

// A self-contained 1×1 PNG, with no dependency on a user's documents.
const pngBytes = new Uint8Array(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
));

async function documentXml(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file("word/document.xml")!.async("string");
}

function attributes(tag: string) {
  return Object.fromEntries(Array.from(tag.matchAll(/([\w:]+)="([^"]*)"/g),
    ([, name, value]) => [name, value]));
}

test("visual DOCX preserves each PDF page's dimensions and zero margins", async () => {
  const xml = await documentXml(await buildDocxFromPdfPages([
    { pageNumber: 1, pngBytes, widthPts: 612, heightPts: 792 },
    { pageNumber: 2, pngBytes, widthPts: 595.3, heightPts: 841.9 },
  ]));
  const sections = Array.from(xml.matchAll(/<w:sectPr\b[^>]*>([\s\S]*?)<\/w:sectPr>/g),
    ([, contents]) => contents);
  assert.equal(sections.length, 2);
  for (const [index, section] of sections.entries()) {
    const size = attributes(section.match(/<w:pgSz\b[^>]*\/>/)![0]);
    const margin = attributes(section.match(/<w:pgMar\b[^>]*\/>/)![0]);
    assert.equal(size["w:w"], String([12240, 11906][index]));
    assert.equal(size["w:h"], String([15840, 16838][index]));
    for (const edge of ["top", "right", "bottom", "left"]) {
      assert.equal(margin[`w:${edge}`], "0", `section ${index + 1} ${edge} margin`);
    }
  }
  assert.equal((xml.match(/<w:drawing>/g) ?? []).length, 2);
  assert.equal((xml.match(/<wp:anchor\b/g) ?? []).length, 2);
  assert.equal((xml.match(/relativeFrom="page"/g) ?? []).length, 4);
  assert.doesNotMatch(xml, /<wp:inline\b/);
});

test("visual DOCX rejects an empty PDF page list", async () => {
  await assert.rejects(buildDocxFromPdfPages([]), /No PDF pages to convert/);
});

test("editable DOCX retains title, paragraphs, and XML-sensitive text", async () => {
  const xml = await documentXml(await buildDocxFromText("Report", "Alpha & beta\n\n <end> "));
  assert.match(xml, /<w:t[^>]*>Report<\/w:t>/);
  assert.match(xml, /<w:t[^>]*>Alpha &amp; beta<\/w:t>/);
  assert.match(xml, /<w:t[^>]*>&lt;end&gt;<\/w:t>/);
  assert.doesNotMatch(xml, /<w:drawing>/);
});

test("editable DOCX explains when a scanned PDF has no extractable text", async () => {
  const xml = await documentXml(await buildDocxFromText("Scan", " \n\n "));
  assert.match(xml, /No extractable text was found in this PDF/);
});

test("editable multipage DOCX keeps page labels and extracted content in order", async () => {
  const xml = await documentXml(await buildDocxFromPageTexts("Pages", ["First line\nSecond line", "Final page"]));
  const texts = Array.from(xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g), ([, text]) => text);
  assert.deepEqual(texts, ["Pages", "Page 1", "First line", "Second line", "Page 2", "Final page"]);
});

for (const extension of ["doc", "ppt"]) {
  test(`Office converter rejects legacy .${extension} with actionable guidance`, async () => {
    await assert.rejects(convertOfficeFile({
      file: new File(["legacy fixture"], `fixture.${extension}`),
      sourceExt: extension,
      targetFormat: "pdf",
    }), new RegExp(`Legacy \\.${extension}.*Save as \\.${extension}x`));
  });
}

test("Office converter rejects an unsupported conversion before rendering", async () => {
  await assert.rejects(convertOfficeFile({
    file: new File(["fixture"], "fixture.txt"),
    sourceExt: "txt",
    targetFormat: "docx",
  }), /Conversion txt → docx is not supported/);
});

test("PPTX image slides convert through the production function without private fixtures", async () => {
  const zip = new JSZip();
  for (const slide of [1, 2]) {
    zip.file(`ppt/slides/slide${slide}.xml`, "<p:sld/>");
    zip.file(`ppt/slides/_rels/slide${slide}.xml.rels`,
      '<Relationships><Relationship Target="../media/image1.png"/></Relationships>');
  }
  zip.file("ppt/media/image1.png", pngBytes);
  const data = await zip.generateAsync({ type: "uint8array" });
  const result = await convertPptxToPdf(new File([new Uint8Array(data)], "fixture.pptx"));
  assert.equal(result.type, "application/pdf");
  const pdf = await PDFDocument.load(await result.arrayBuffer());
  assert.equal(pdf.getPageCount(), 2);
  for (const page of pdf.getPages()) assert.deepEqual(page.getSize(), { width: 1, height: 1 });
});

test("PPTX with no slides fails with a useful error", async () => {
  const data = await new JSZip().generateAsync({ type: "uint8array" });
  await assert.rejects(convertPptxToPdf(new File([new Uint8Array(data)], "empty.pptx")), /No slides found/);
});

test("PPTX rejects mixed text/image slides instead of silently dropping content", async () => {
  const zip = new JSZip();
  zip.file("ppt/slides/slide1.xml", '<p:sld><a:t>Required heading</a:t></p:sld>');
  zip.file("ppt/slides/_rels/slide1.xml.rels", '<Relationships><Relationship Target="../media/image1.png"/></Relationships>');
  zip.file("ppt/media/image1.png", pngBytes);
  const data = await zip.generateAsync({ type: "uint8array" });
  await assert.rejects(convertPptxToPdf(new File([new Uint8Array(data)], "mixed.pptx")), /cannot be converted reliably/);
});

test("PPTX with an empty slide reports that no content can be extracted", async () => {
  const zip = new JSZip();
  zip.file("ppt/slides/slide1.xml", "<p:sld/>");
  const data = await zip.generateAsync({ type: "uint8array" });
  await assert.rejects(convertPptxToPdf(new File([new Uint8Array(data)], "blank.pptx")), /no extractable text or images/);
});

test("PPTX image conversion uses presentation points instead of raster pixels", async () => {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const presentation = new PptxGenJS();
  presentation.defineLayout({ name: "TEST", width: 10, height: 5 }); presentation.layout = "TEST";
  presentation.addSlide().addImage({ data: `image/png;base64,${Buffer.from(pngBytes).toString("base64")}`, x: 2.5, y: 0, w: 5, h: 5 });
  const bytes = await presentation.write({ outputType: "arraybuffer" }) as ArrayBuffer;
  const result = await convertPptxToPdf(new File([bytes], "image-slide.pptx"));
  const pdf = await PDFDocument.load(await result.arrayBuffer());
  assert.deepEqual(pdf.getPage(0).getSize(), { width: 720, height: 360 });
});
