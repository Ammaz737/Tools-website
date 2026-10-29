import { test, expect } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { writeFile } from "node:fs/promises";

test("measure production cold and warm browser transfer without uploading PDF bytes", async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText("Bandwidth fixture", { x: 30, y: 700, font, size: 20 });
  const bytes = Buffer.from(await pdf.save());
  const scenarios: Array<{ name: string; responseWireBytes: number; fileUploadBytes: number; requests: number }> = [];
  for (const journey of ["home-then-compress", "cold-compress"]) {
    const context = await browser.newContext({ baseURL });
    try {
      const page = await context.newPage();
      const network = await context.newCDPSession(page);
      await network.send("Network.enable");
      const urls = new Map<string, string>(); let wire = 0; let uploads = 0; let requests = 0;
      network.on("Network.requestWillBeSent", event => {
        urls.set(event.requestId, event.request.url);
        if (event.request.url.startsWith(baseURL!)) {
          requests++;
          if (event.request.method === "POST" && !event.request.url.includes("/use")) uploads += Buffer.byteLength(event.request.postData ?? "");
        }
      });
      network.on("Network.loadingFinished", event => { if (urls.get(event.requestId)?.startsWith(baseURL!)) wire += event.encodedDataLength; });
      if (journey === "home-then-compress") {
        await page.goto("/"); await page.waitForLoadState("networkidle");
        scenarios.push({ name: "cold-home", responseWireBytes: wire, fileUploadBytes: uploads, requests });
        wire = 0; requests = 0; uploads = 0;
      }
      await page.goto("/tools/compress-pdf");
      await page.locator('input[type="file"]').first().setInputFiles({ name: "small.pdf", mimeType: "application/pdf", buffer: bytes });
      await page.getByRole("button", { name: "Compress PDF", exact: true }).click();
      await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible();
      await page.waitForLoadState("networkidle");
      scenarios.push({ name: journey === "cold-compress" ? "cold-compress-with-preview" : "compress-after-home-with-cache", responseWireBytes: wire, fileUploadBytes: uploads, requests });
      expect(uploads).toBe(0);
    } finally { await context.close(); }
  }
  const report = { measuredAt: new Date().toISOString(), scope: "Chromium, next start with gzip, HTTP response wire bytes (including headers), browser HTTP cache enabled, one small generated PDF. Excludes blob downloads, provider traffic, OCR/HEIC engines and CDN-specific compression. Not a concurrent-user load test.", scenarios };
  await writeFile("docs/bandwidth-baseline.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
});
