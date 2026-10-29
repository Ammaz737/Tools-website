import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { tools } from "../../lib/tools";
import { isImplementedTool } from "../../lib/tool-capabilities";

test("all registered tool URLs render with accurate indexing policy", async ({ request }) => {
  test.setTimeout(180_000);
  for (const tool of tools) {
    const response = await request.get(`/tools/${tool.id}`);
    expect(response.status(), tool.id).toBe(200);
    const html = await response.text();
    if (isImplementedTool(tool.id) && tool.category !== "ai") {
      expect(html, tool.id).toContain("application/ld+json");
    } else {
      expect(html, tool.id).not.toContain("application/ld+json");
      expect(html, tool.id).toContain("noindex");
    }
    expect(html, tool.id).toContain(tool.name.replaceAll("&", "&amp;"));
  }
});

test("case converter transforms input and clears result on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/tools/case-converter");
  await page.getByLabel("Input Text").fill("Hello world!");
  await page.getByRole("button", { name: "UPPERCASE", exact: true }).click();
  await expect(page.locator("pre")).toHaveText("HELLO WORLD!");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByLabel("Input Text")).toHaveValue("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("sitemap and private pages follow the indexing policy", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  for (const tool of tools) {
    expect(xml.includes(`/tools/${tool.id}</loc>`), tool.id).toBe(isImplementedTool(tool.id) && tool.category !== "ai");
  }
  const admin = await request.get("/admin");
  expect(await admin.text()).toContain("noindex");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).not.toContain("Disallow: /admin");
  const status = await request.get("/api/tools/status");
  expect(await status.json()).not.toHaveProperty("mongoConfigured");
  const about = await (await request.get("/about")).text();
  expect(about).not.toContain("Thin defensive backend");
  const plagiarism = await (await request.get("/tools/plagiarism-checker")).text();
  expect(plagiarism).not.toContain("Wire a provider");
});

test("logout rejects cross-origin requests", async ({ request }) => {
  const denied = await request.post("/api/admin/logout", { headers: { Origin: "https://untrusted.example" } });
  expect(denied.status()).toBe(403);
  const allowed = await request.post("/api/admin/logout", { headers: { Origin: String(test.info().project.use.baseURL) } });
  expect(allowed.status()).toBe(200);
});

test("JSON formatter handles valid, invalid and empty input", async ({ page }) => {
  await page.goto("/tools/json-formatter");
  const input = page.getByLabel("Raw JSON");
  await input.fill('{"answer":42}');
  await expect(page.locator("pre")).toHaveText('{\n  "answer": 42\n}');
  await input.fill("{bad}");
  await expect(page.getByText("Error", { exact: true })).toBeVisible();
  await expect(page.locator("pre")).not.toContainText('"answer"');
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(input).toHaveValue("");
});

test("merge PDFs downloads a readable document and sends no file bytes", async ({ page }) => {
  const uploads: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && !request.url().includes("/use")) uploads.push(request.url());
  });
  await page.goto("/tools/merge-pdf");
  const first = await PDFDocument.create();
  first.addPage([200, 300]);
  const second = await PDFDocument.create();
  second.addPage([400, 500]);
  await page.locator('input[type="file"]').setInputFiles([
    { name: "first.pdf", mimeType: "application/pdf", buffer: Buffer.from(await first.save()) },
    { name: "second ü.pdf", mimeType: "application/pdf", buffer: Buffer.from(await second.save()) },
  ]);
  await page.getByRole("button", { name: "Merge 2 PDFs", exact: true }).click();
  const downloadReady = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadReady;
  const output = await PDFDocument.load(await readFile((await download.path())!));
  expect(output.getPageCount()).toBe(2);
  expect(output.getPages().map((p) => p.getSize())).toEqual([
    { width: 200, height: 300 }, { width: 400, height: 500 },
  ]);
  expect(uploads).toEqual([]);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
});

test("admin APIs reject forged fallback cookies when configuration is absent", async ({ request }) => {
  const { createHmac } = await import("node:crypto");
  const payload = `admin:${Date.now()}`;
  const signature = createHmac("sha256", "dev-insecure-secret").update(payload).digest("hex");
  const response = await request.get("/api/admin/tools", {
    headers: { Cookie: `qw_admin_session=${payload}.${signature}` },
  });
  expect(response.status()).toBe(401);
});

test("AI validates empty prompts and throttles repeated requests", async ({ request }) => {
  for (let i = 0; i < 10; i++) {
    const response = await request.post("/api/ai", { data: { prompt: "" } });
    expect(response.status()).toBe(400);
  }
  const limited = await request.post("/api/ai", { data: { prompt: "" } });
  expect(limited.status()).toBe(429);
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
});

test("login fails closed then throttles repeated attempts without trusting spoofed headers", async ({ request }) => {
  for (let i = 0; i < 5; i++) {
    const response = await request.post("/api/admin/login", {
      data: { password: "incorrect" }, headers: { "x-forwarded-for": `203.0.113.${i}` },
    });
    expect(response.status()).toBe(501);
  }
  const limited = await request.post("/api/admin/login", { data: { password: "incorrect" } });
  expect(limited.status()).toBe(429);
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
});
