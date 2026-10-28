import { test, expect } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
test("HEIC primary image decodes locally to real JPEG with reference colors", async ({ page }) => {
  const external: string[] = [];
  page.on("request", request => { if (!request.url().startsWith("http://127.0.0.1:3100") && /^https?:/.test(request.url())) external.push(request.url()); });
  await page.goto("/tools/heic-to-jpg");
  await page.locator('input[type="file"]').setInputFiles("tests/fixtures/heic/example.heic");
  await expect(page.getByAltText("Converted preview")).toBeVisible({ timeout: 45_000 });
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.jpg$/);
  const bytes = await readFile((await download.path())!);
  expect([...bytes.subarray(0, 3)]).toEqual([255,216,255]);
  const expected = JSON.parse(await readFile("tests/fixtures/heic/expected.json", "utf8"));
  const actual = await page.evaluate(async ({ base64, points }) => {
    const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))]));
    const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!; ctx.drawImage(bitmap, 0, 0);
    const result = { width: bitmap.width, height: bitmap.height, points: points.map(({x,y}: {x:number;y:number}) => Array.from(ctx.getImageData(x,y,1,1).data)) };
    bitmap.close(); return result;
  }, { base64: bytes.toString("base64"), points: expected.points });
  expect(actual.width).toBe(expected.width); expect(actual.height).toBe(expected.height);
  for (let i = 0; i < expected.points.length; i++) for (let channel = 0; channel < 3; channel++) expect(Math.abs(actual.points[i][channel] - expected.points[i].rgba[channel])).toBeLessThanOrEqual(12);
  expect(external).toEqual([]);
  await mkdir("docs/quality-evidence/heic", { recursive: true }); await writeFile("docs/quality-evidence/heic/primary.jpg", bytes);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
});
test("HEIC malformed input rejects then a valid file recovers", async ({ page }) => {
  await page.goto("/tools/heic-to-jpg");
  await page.locator('input[type="file"]').setInputFiles({ name: "broken.heic", mimeType: "image/heic", buffer: Buffer.from("not a HEIC") });
  await expect(page.locator('p[role="alert"]')).toContainText("Not a valid HEIC/HEIF");
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(0);
  await page.locator('input[type="file"]').setInputFiles("tests/fixtures/heic/example.heic");
  await expect(page.getByAltText("Converted preview")).toBeVisible({ timeout:45_000 });
});
