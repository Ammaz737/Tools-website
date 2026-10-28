import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { convertNativeOffice, officeConverterConfiguration, OfficeConversionError, MAX_OFFICE_PDF_BYTES, readOfficeUpload, type OfficeFormat } from "../lib/server/office-conversion";
import { GET, POST } from "../app/api/convert-office/route";

const environment = ["OFFICE_CONVERTER_URL", "OFFICE_CONVERTER_AUTH_HEADER", "OFFICE_CONVERTER_TIMEOUT_MS", "MONGODB_URI"] as const;
function configure(t: TestContext) {
  const previous = environment.map(key => [key, process.env[key]] as const);
  t.after(() => { for (const [key, value] of previous) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  for (const key of environment) delete process.env[key];
  process.env.OFFICE_CONVERTER_URL = "http://office-converter:3000";
}
async function office(format: OfficeFormat) {
  const zip = new JSZip(); zip.file("[Content_Types].xml", "<Types/>");
  zip.file(format === "docx" ? "word/document.xml" : format === "xlsx" ? "xl/workbook.xml" : "ppt/presentation.xml", "<document/>");
  return zip.generateAsync({ type: "uint8array" });
}
async function pdf(count = 1) { const doc = await PDFDocument.create(); for (let i = 0; i < count; i++) doc.addPage([100, 100]); return doc.save(); }
function request(bytes: Uint8Array, query = "toolId=word-to-pdf&format=docx", origin = "http://localhost") {
  return new Request(`http://localhost/api/convert-office?${query}`, { method: "POST", headers: { origin, "content-type": "application/octet-stream" }, body: bytes as BodyInit });
}

test("office conversion configuration is optional, private endpoint is fixed and secrets never appear in availability", async t => {
  configure(t); process.env.OFFICE_CONVERTER_AUTH_HEADER = "Bearer private-token";
  assert.deepEqual(await GET().json(), { available: true });
  for (const value of ["file:///tmp/test", "https://user:secret@worker.test", "http://worker.test/path", "http://worker.test?key=secret"]) {
    process.env.OFFICE_CONVERTER_URL = value; assert.equal(officeConverterConfiguration(), null);
  }
  delete process.env.OFFICE_CONVERTER_URL;
  assert.deepEqual(await GET().json(), { available: false });
  assert.equal((await POST(request(await office("docx")))).status, 503);
});

test("native conversion submits one fixed-name file, retains auth privately, returns structurally valid PDFs for three Office formats", async t => {
  configure(t); process.env.OFFICE_CONVERTER_AUTH_HEADER = "Basic cHJpdmF0ZTpwYXNzd29yZA==";
  const output = await pdf();
  t.mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(String(url), "http://office-converter:3000/forms/libreoffice/convert");
    assert.equal(init.redirect, "error"); assert.equal(init.method, "POST");
    assert.equal((init.headers as Record<string, string>).Authorization, process.env.OFFICE_CONVERTER_AUTH_HEADER);
    const form = init.body as FormData; assert.equal([...form.keys()].length, 1);
    const file = form.get("files") as File; assert.match(file.name, /^document\.(docx|xlsx|pptx)$/);
    assert.equal(file.name.includes(".."), false);
    return new Response(output as BodyInit, { headers: { "content-type": "application/pdf" } });
  });
  for (const format of ["docx", "xlsx", "pptx"] as const) {
    const converted = await convertNativeOffice(await office(format), format);
    assert.equal((await PDFDocument.load(converted)).getPageCount(), 1);
  }
});

test("route rejects cross-origin or mismatched source/tool and emits safe PDF attachment", async t => {
  configure(t); const bytes = await office("docx");
  assert.equal((await POST(request(bytes, undefined, "https://evil.example"))).status, 403);
  assert.equal((await POST(request(bytes, "toolId=word-to-pdf&format=pptx"))).status, 400);
  assert.equal((await POST(request(bytes, "toolId=pdf-to-word&format=docx"))).status, 400);
  t.mock.method(globalThis, "fetch", async () => new Response(await pdf() as BodyInit, { headers: { "content-type": "application/pdf" } }));
  const response = await POST(request(bytes)); assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.equal(response.headers.get("content-disposition"), 'attachment; filename="converted.pdf"');
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await PDFDocument.load(await response.arrayBuffer())).getPageCount(), 1);
});

test("upload counts real bytes instead of trusting length and cancels stalled streams", async () => {
  const oversized = new Request("http://localhost", { method: "POST", headers: { "content-type": "application/octet-stream", "content-length": "1" }, body: new Uint8Array(9) });
  await assert.rejects(readOfficeUpload(oversized, 8), (error: OfficeConversionError) => error.status === 413);
  const type = new Request("http://localhost", { method: "POST", body: "not raw" });
  await assert.rejects(readOfficeUpload(type), (error: OfficeConversionError) => error.status === 415);
  let cancelled = false;
  const stalled = new Request("http://localhost", { method: "POST", headers: { "content-type": "application/octet-stream" }, body: new ReadableStream({ cancel() { cancelled = true; } }), duplex: "half" } as RequestInit);
  await assert.rejects(readOfficeUpload(stalled, 8, 10), (error: OfficeConversionError) => error.status === 408);
  assert.equal(cancelled, true);
});

test("worker failures, wrong signatures/formats and oversized or invalid PDF responses are sanitized", async t => {
  configure(t); const bytes = await office("docx");
  let mode = "upstream"; let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    if (mode === "upstream") return new Response("private-token internal stack", { status: 500 });
    if (mode === "redirect") return new Response(null, { status: 302, headers: { location: "http://private-token.example/internal" } });
    if (mode === "stream") return new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_OFFICE_PDF_BYTES + 1)); controller.close(); } }), { headers: { "content-type": "application/pdf", "content-length": "1" } });
    if (mode === "type") return new Response("PK00", { headers: { "content-type": "application/zip" } });
    if (mode === "length") return new Response("%PDF-bad", { headers: { "content-type": "application/pdf", "content-length": "99999999" } });
    if (mode === "pages") return new Response(await pdf(51) as BodyInit, { headers: { "content-type": "application/pdf" } });
    return new Response("%PDF-bad", { headers: { "content-type": "application/pdf" } });
  });
  await assert.rejects(convertNativeOffice(new Uint8Array([1, 2]), "docx"), (e: OfficeConversionError) => e.status === 400);
  await assert.rejects(convertNativeOffice(await office("xlsx"), "docx"), (e: OfficeConversionError) => e.status === 400);
  assert.equal(calls, 0);
  for (mode of ["upstream", "redirect", "type", "length", "stream", "pages", "malformed"]) await assert.rejects(convertNativeOffice(bytes, "docx"), (e: OfficeConversionError) => e.status === 502 && !/private-token|stack|office-converter/.test(e.message));
});

test("worker fetch and response-body deadlines abort and release conversion capacity", async t => {
  configure(t); const bytes = await office("docx"); let bodyCancelled = false;
  // Advance the deadline only after the phase under test is actually blocked.
  // Real wall time could expire during ZIP validation under a parallel suite.
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let bodyReading!: () => void;
  const bodyStarted = new Promise<void>(resolve => { bodyReading = resolve; });
  t.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
    pull() { bodyReading(); }, cancel() { bodyCancelled = true; },
  }, { highWaterMark: 0 }), { headers: { "content-type": "application/pdf" } }));
  const bodyRejected = assert.rejects(convertNativeOffice(bytes, "docx", { timeoutMs: 20 }), (e: OfficeConversionError) => e.status === 504);
  await bodyStarted; t.mock.timers.tick(20); await bodyRejected;
  assert.equal(bodyCancelled, true);
  let fetchEntered!: () => void;
  const fetchStarted = new Promise<void>(resolve => { fetchEntered = resolve; });
  t.mock.method(globalThis, "fetch", () => { fetchEntered(); return new Promise(() => undefined); });
  const fetchRejected = assert.rejects(convertNativeOffice(bytes, "docx", { timeoutMs: 20 }), (e: OfficeConversionError) => e.status === 504);
  await fetchStarted; t.mock.timers.tick(20); await fetchRejected;
  t.mock.method(globalThis, "fetch", async () => new Response(await pdf() as BodyInit, { headers: { "content-type": "application/pdf" } }));
  assert.ok((await convertNativeOffice(bytes, "docx")).length > 10);
});
test("conversion capacity rejects excess parallel work rather than queueing unbounded documents", async t => {
  configure(t); const bytes = await office("docx"); const releases: Array<(response: Response) => void> = [];
  t.mock.method(globalThis, "fetch", () => new Promise<Response>(resolve => releases.push(resolve)));
  const first = convertNativeOffice(bytes, "docx"); const second = convertNativeOffice(bytes, "docx");
  await assert.rejects(convertNativeOffice(bytes, "docx"), (e: OfficeConversionError) => e.status === 429);
  while (releases.length < 2) await new Promise(resolve => setTimeout(resolve, 1));
  const output = await pdf(); for (const release of releases) release(new Response(output as BodyInit, { headers: { "content-type": "application/pdf" } }));
  await Promise.all([first, second]);
});
