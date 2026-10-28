import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("crop presets download correct dimensions from a rectangular source", async ({ page }) => {
  await page.goto("/tools/crop-image");
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 200;
    const context = canvas.getContext("2d")!; context.fillStyle = "#d04630"; context.fillRect(0, 0, 320, 200);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator('input[type="file"]').setInputFiles({ name: "rectangular.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
  const preview = page.getByAltText("Cropped Preview");
  await expect(preview).toBeVisible();
  for (const [preset, width, height] of [["1:1", 180, 180], ["16:9", 288, 162], ["4:3", 240, 180], ["3:2", 270, 180]] as const) {
    await page.getByRole("button", { name: preset, exact: true }).click();
    await expect.poll(() => preview.evaluate((node: HTMLImageElement, expected) => Math.abs(node.naturalWidth - expected.width) <= 1 && Math.abs(node.naturalHeight - expected.height) <= 1, { width, height })).toBe(true);
    const ready = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download", exact: true }).click();
    const bytes = await readFile((await (await ready).path())!);
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(Math.abs(bytes.readUInt32BE(16) - width), preset).toBeLessThanOrEqual(1);
    expect(Math.abs(bytes.readUInt32BE(20) - height), preset).toBeLessThanOrEqual(1);
  }
});

test("password generation and reset honor selected groups and length", async ({ page }) => {
  await page.goto("/tools/password-generator");
  const output = page.locator("span.font-mono.text-2xl");
  await expect(output).toHaveText(/^.{16}$/);
  await page.getByRole("slider", { name: "Password Length" }).fill("32");
  for (const name of ["Uppercase (A-Z)", "Lowercase (a-z)", "Symbols (!@#$)"]) await page.getByRole("switch", { name, exact: true }).click();
  await expect(output).toHaveText(/^\d{32}$/);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(output).toHaveText(/^\d{32}$/);
  await page.getByRole("switch", { name: "Numbers (0-9)", exact: true }).click();
  await expect(output).toBeEmpty();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(output).toBeEmpty();
  await page.getByRole("switch", { name: "Lowercase (a-z)", exact: true }).click();
  await expect(output).toHaveText(/^[a-z]{32}$/);
});

test("barcode recovers from invalid input and downloads a valid SVG", async ({ page }) => {
  await page.goto("/tools/barcode-generator");
  await page.getByLabel("Barcode Data").fill("\u{1f642}");
  const error = page.locator('[role="alert"]:not(#__next-route-announcer__)').filter({ hasText: "Code 128" });
  await expect(error).toBeVisible();
  await expect(page.getByRole("link", { name: "Download SVG" })).toHaveCount(0);
  await page.getByLabel("Barcode Data").fill("RECOVERY-123");
  await expect(error).toHaveCount(0);
  await expect(page.getByAltText("Generated barcode")).toBeVisible();
  const ready = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download SVG" }).click();
  const download = await ready; expect(download.suggestedFilename()).toBe("barcode.svg");
  const svg = await readFile((await download.path())!, "utf8");
  expect(svg).toContain("<svg"); expect(svg).toContain("<path");
  const dimensions = await page.evaluate((svg) => { const node = new DOMParser().parseFromString(svg, "image/svg+xml"); return { errors: node.querySelectorAll("parsererror").length, viewBox: node.documentElement.getAttribute("viewBox") }; }, svg);
  expect(dimensions.errors).toBe(0); expect(dimensions.viewBox).toMatch(/^0 0 \d+ \d+$/);
});

test("notepad preserves Unicode notes across reload", async ({ page }) => {
  await page.goto("/tools/notepad-online");
  const note = "Saved note \u2014 \u0627\u0631\u062f\u0648\nSecond line";
  const input = page.getByPlaceholder("Start typing your notes here...");
  await input.fill(note);
  await expect(page.getByText(`${note.length} characters`, { exact: true })).toBeVisible();
  await page.reload(); await expect(input).toHaveValue(note);
});

test("theme toggles both directions and persists after reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" }); await page.goto("/");
  const button = page.getByRole("button", { name: "Toggle color theme" });
  await expect(button).toHaveText("Dark mode"); await button.click();
  await expect(page.locator("html")).toHaveClass(/dark/); await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/); await expect(button).toHaveText("Light mode");
  await button.click(); await expect(page.locator("html")).not.toHaveClass(/dark/); await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/); await expect(button).toHaveText("Dark mode");
});
