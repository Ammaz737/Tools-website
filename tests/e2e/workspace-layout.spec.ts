import { test, expect } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";

test("home search, category filters and mobile tools menu work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Image", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Image", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".popular-grid a").first()).toHaveAttribute(
    "href",
    /\/tools\//,
  );
  await expect(page.locator(".popular-grid")).not.toContainText("Merge PDF");
  const search = page.getByRole("searchbox", { name: "Search tools" });
  await search.fill("merge pdf");
  await expect(
    page
      .locator(".search-suggestions")
      .getByRole("link", { name: "Merge PDF", exact: true }),
  ).toBeVisible();
  await search.press("Escape");
  await expect(page.locator(".search-suggestions")).toHaveCount(0);
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(search).toBeEmpty();
  await search.fill("resize");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/tools\?q=resize/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("resize");
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/");
  await page.locator(".nav-menu summary").click();
  await expect(page.locator(".mega-menu")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page
    .locator(".mega-menu")
    .getByRole("link", { name: "PDF", exact: true })
    .click();
  await expect(page).toHaveURL(/\/category\/pdf/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page
      .locator(".floating-tool")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

test("tool workspaces and navigation fit desktop and narrow phones", async ({
  page,
}) => {
  test.setTimeout(180_000);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `home at ${width}px`,
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`home-${width}.png`),
      fullPage: true,
    });
    if (width === 1440) await page.screenshot({ path: test.info().outputPath("home-hero.png") });
    for (const slug of [
      "pdf-to-jpg",
      "image-resizer",
      "grammar-checker",
      "word-counter",
      "json-formatter",
      "meta-tag-generator",
      "password-generator",
      "length-converter",
      "bmi-calculator",
      "qr-code-generator",
    ]) {
      await page.goto(`/tools/${slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("link", { name: "All tools", exact: true }).first(),
      ).toBeVisible();
      await expect(page.locator(".tool-workspace")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${slug} at ${width}px`,
      ).toBe(true);
    }
  }
});

test("PDF image preview and ZIP retain portrait and landscape page proportions", async ({
  page,
}) => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const [width, height] of [
    [300, 400],
    [500, 300],
  ]) {
    const sheet = pdf.addPage([width, height]);
    sheet.drawText("Aligned document export", {
      x: 20,
      y: height - 40,
      font,
      size: 16,
    });
  }
  await page.goto("/tools/pdf-to-jpg");
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "layout.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await pdf.save()),
    });
  await page
    .getByRole("button", { name: "Convert PDF pages", exact: true })
    .click();
  const panel = page.locator(".result-panel");
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Download", exact: true }),
  ).toHaveText("Download ZIP");
  await expect(
    panel.getByText("layout-pages.zip", { exact: true }),
  ).toBeVisible();
  const pending = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Download", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("layout-pages.zip");
  const zip = await JSZip.loadAsync(await readFile((await download.path())!));
  for (const [index, size] of [
    [600, 800],
    [1000, 600],
  ].entries()) {
    const image = await zip
      .file(`layout-page-${index + 1}.jpg`)!
      .async("base64");
    const dimensions = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/jpeg;base64,${base64}`;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, image);
    expect(dimensions).toEqual(size);
  }
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: test.info().outputPath("pdf-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("pdf-mobile.png"),
    fullPage: true,
  });
  await page.getByLabel("Render quality").selectOption("3");
  await expect(panel).toHaveCount(0);
});
