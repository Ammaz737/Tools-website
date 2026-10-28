import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("qr-code-generator: readable PNG download, empty and size-limit recovery", async ({ page }) => {
  await page.goto("/tools/qr-code-generator");
  const input = page.getByLabel("QR Code Text / URL");
  await input.fill("https://example.org/اردو?value=42");
  await expect(page.getByAltText("QR Code")).toBeVisible();
  const ready = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PNG", exact: true }).click();
  const bytes = await readFile((await (await ready).path())!);
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(bytes.readUInt32BE(16)).toBe(300); expect(bytes.readUInt32BE(20)).toBe(300);
  await input.fill(""); await expect(page.getByAltText("QR Code")).toHaveCount(0);
  await input.fill("A".repeat(1001)); await expect(page.locator("p[role=alert]")).toContainText("1,000");
  await expect(page.getByRole("link", { name: "Download PNG", exact: true })).toHaveCount(0);
  await input.fill("recovered"); await expect(page.getByAltText("QR Code")).toBeVisible();
});

for (const id of ["color-picker", "color-converter"]) test(`${id}: exact RGB conversion and invalid-input recovery`, async ({ page }) => {
  await page.goto(`/tools/${id}`); const input = page.getByLabel("HEX Value");
  await input.fill("#12ABEF"); await expect(page.getByText("rgb(18, 171, 239)", { exact: true })).toBeVisible();
  await input.fill("invalid"); await expect(page.locator("p[role=alert]")).toContainText("six-digit");
  await expect(page.getByText("rgb(18, 171, 239)", { exact: true })).toHaveCount(0);
  await input.fill("#000000"); await expect(page.getByText("rgb(0, 0, 0)", { exact: true })).toBeVisible();
});

test("random-password-generator: alias honors selected groups and length", async ({ page }) => {
  await page.goto("/tools/random-password-generator");
  const output = page.locator("span.font-mono.text-2xl");
  await expect(output).toHaveText(/^.{16}$/);
  await page.getByRole("slider", { name: "Password Length" }).fill("32");
  for (const name of ["Uppercase (A-Z)", "Lowercase (a-z)", "Symbols (!@#$)"]) await page.getByRole("switch", { name, exact: true }).click();
  await expect(output).toHaveText(/^\d{32}$/);
  await page.getByRole("button", { name: "Reset", exact: true }).click(); await expect(output).toHaveText(/^\d{32}$/);
  await page.getByRole("switch", { name: "Numbers (0-9)", exact: true }).click(); await expect(output).toBeEmpty();
});

test("coin-flipper: produces a valid outcome and can flip again", async ({ page }) => {
  await page.goto("/tools/coin-flipper");
  const button = page.getByRole("button", { name: "Flip Coin", exact: true });
  await button.click(); await expect(page.getByText(/^(HEADS|TAILS)$/)).toBeVisible(); await expect(button).toBeEnabled();
  await button.click(); await expect(button).toBeEnabled(); await expect(page.getByText(/^(HEADS|TAILS)$/)).toBeVisible();
});
