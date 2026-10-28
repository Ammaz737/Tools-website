// Live local browser checks. No traces, storage state, cookies or secrets are saved.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
if (process.env.MONGODB_URI?.trim() && !/[<>]/.test(process.env.MONGODB_URI)) throw new Error("Use dedicated staging acceptance with a configured database.");
const runtime = new URL("../tmp/live-browser-runtime/", import.meta.url);
await mkdir(runtime, { recursive: true });
if (process.platform === "win32") { const { fileURLToPath } = await import("node:url"); process.env.TEMP = fileURLToPath(runtime); process.env.TMP = fileURLToPath(runtime); }
const base = new URL(process.env.LOCAL_CHECK_BASE_URL || "http://127.0.0.1:3100");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname) || !["http:", "https:"].includes(base.protocol) || base.username || base.password) throw new Error("Local verification requires a loopback origin");
const results = [];
console.log("Local browser: launching");
const browser = await chromium.launch({ channel: "chromium", headless: true });
const context = await browser.newContext({ acceptDownloads: true, baseURL: base.origin });
const page = await context.newPage(); page.setDefaultTimeout(30000); page.setDefaultNavigationTimeout(30000);
try {
  try {
    console.log("Local browser: admin sign-in");
    await page.goto("/admin"); await page.getByLabel("Password", { exact: true }).fill(process.env.ADMIN_PASSWORD || "");
    await page.getByRole("button", { name: "Enter admin", exact: true }).click();
    await page.waitForURL("**/admin/tools", { timeout: 15000 });
    await page.getByRole("button", { name: "Log out", exact: true }).waitFor();
    assert.ok((await page.locator("body").innerText()).includes("MongoDB is not configured"));
    await page.getByRole("button", { name: "Log out", exact: true }).click(); await page.waitForURL("**/admin", { timeout: 15000 });
    await page.goto("/admin/tools"); await page.waitForURL("**/admin", { timeout: 15000 });
    results.push({ name: "real browser signs in, sees explicit persistence warning and signs out", status: "PASS" });
  } catch { results.push({ name: "real browser admin login/logout", status: "FAIL", error: "Browser authentication assertion failed; secrets omitted" }); }
  try {
    console.log("Local browser: native Office conversion");
    await page.goto("/tools/word-to-pdf");
    assert.ok((await page.locator("body").innerText()).includes("Choosing the server option uploads your document."));
    await page.locator('input[type="file"]').first().setInputFiles("docs/quality-evidence/native-office/editable-tables.docx");
    await page.getByLabel("Conversion processing").selectOption("server");
    const responsePending = page.waitForResponse(response => response.url().includes("/api/convert-office?") && response.request().method() === "POST");
    await page.getByRole("button", { name: /^Convert Document/ }).click();
    assert.equal((await responsePending).status(), 200);
    const downloadPending = page.waitForEvent("download"); await page.getByRole("button", { name: "Download", exact: true }).click();
    const downloaded = await readFile(await (await downloadPending).path());
    assert.equal((await PDFDocument.load(downloaded)).getPageCount(), 2);
    await writeFile("docs/quality-evidence/native-office/browser-download.pdf", downloaded);
    results.push({ name: "real browser uploads to authenticated native service and downloads two-page PDF", status: "PASS" });
  } catch { results.push({ name: "real browser native Office conversion", status: "FAIL", error: "Native browser conversion assertion failed" }); }
} finally { await context.close(); await browser.close(); }
await writeFile("docs/local-browser-live-results.json", JSON.stringify({ checkedAt: new Date().toISOString(), scope: "Actual Chromium against loopback production app and native worker; no paid provider calls or Atlas writes.", origin: base.origin, appBuildId: (await readFile(".next/BUILD_ID", "utf8")).trim(), results }, null, 2) + "\n");
console.log(results); if(results.some(result => result.status !== "PASS")) process.exitCode = 1;
