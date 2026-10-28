import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { Document, Packer, Paragraph } from "docx";
import { PDFDocument, StandardFonts } from "pdf-lib";

test("Office server choice discloses upload and sends raw document with tool mapping", async ({ page }) => {
  const source = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph("Native fixture")] }] }));
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText("Native fixture", { font }); const output = Buffer.from(await pdf.save());
  // WebKit's intercepted-request API can omit Blob bodies. Verify bytes at a
  // real loopback receiver instead of weakening the transport assertion.
  let received: (value: { body: Buffer; contentType?: string; url?: string }) => void = () => undefined;
  const upload = new Promise<{ body: Buffer; contentType?: string; url?: string }>(resolve => { received = resolve; });
  const receiver = createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "content-type");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Connection", "close");
    if (request.method === "OPTIONS") { response.writeHead(204); response.end(); return; }
    const chunks: Buffer[] = [];
    request.on("data", chunk => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      received({ body: Buffer.concat(chunks), contentType: request.headers["content-type"], url: request.url });
      response.writeHead(200, { "Content-Type": "application/pdf" }); response.end(output);
    });
  });
  await new Promise<void>(resolve => receiver.listen(0, "127.0.0.1", resolve));
  const address = receiver.address();
  if (!address || typeof address === "string") throw new Error("Loopback receiver unavailable");
  try {
    await page.route("**/api/convert-office**", async route => {
      if (route.request().method() === "GET") return route.fulfill({ json: { available: true } });
      await route.continue({ url: "http://127.0.0.1:" + address.port + "/convert" + new URL(route.request().url()).search });
    });
    await page.goto("/tools/word-to-pdf");
    const input = page.locator('input[type="file"]').first();
    await expect(input).toBeEnabled();
    await input.setInputFiles({ name: "native.docx", mimeType: "application/octet-stream", buffer: source });
    await page.getByLabel("Conversion processing").selectOption("server");
    await expect(page.getByRole("note")).toContainText("uploaded");
    await page.getByRole("button", { name: /^Convert Document/ }).click();
    await expect(page.getByText("Converted by the configured server Office engine.", { exact: false })).toBeVisible();
    const sent = await upload;
    expect(sent.url).toContain("toolId=word-to-pdf&format=docx");
    expect(sent.contentType).toBe("application/octet-stream");
    expect(sent.body.equals(source)).toBe(true);
    await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible();
  } finally { await new Promise<void>(resolve => receiver.close(() => resolve())); }
});

test("Plagiarism requires consent and labels simulated provider results", async ({ page }) => {
  await page.route("**/api/plagiarism", route => route.fulfill({ status: 202, json: { jobId: "a".repeat(32), accessToken: "b".repeat(43), sandbox: true } }));
  await page.route("**/api/plagiarism/*", route => route.fulfill({ json: { state: "completed", result: { score: 12.5, sources: [{ title: "Reference", url: "https://example.com/source", matchedWords: 4 }], sourcesTruncated: false, otherSourceCount: 0 } } }));
  await page.goto("/tools/plagiarism-checker");
  await page.getByLabel("Text to check").fill("Originality verification fixture.");
  await expect(page.getByRole("button", { name: "Check originality", exact: true })).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Check originality", exact: true }).click();
  await expect(page.getByTestId("plagiarism-result")).toContainText("12.5%");
  await expect(page.getByRole("note")).toContainText("simulated");
  await expect(page.getByRole("link", { name: "Reference", exact: true })).toHaveAttribute("href", "https://example.com/source");
  await page.getByRole("button", { name: "Clear check" }).click();
  await expect(page.getByTestId("plagiarism-result")).toHaveCount(0);
});

