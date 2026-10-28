import { test, expect } from "@playwright/test";

const cases = [
  ["discount-calculator", "Final price", "80.00", "Original price"],
  ["profit-calculator", "Net profit", "400.00", "Revenue"],
  ["roi-calculator", "ROI percent", "20.00", "Initial investment"],
  ["tip-calculator", "Per person", "57.50", "Bill amount"],
  ["margin-calculator", "Gross margin percent", "40.00", "Cost"],
  ["mortgage-calculator", "Monthly payment", "1,199.10", "Loan principal"],
] as const;
for (const [slug, output, expected, input] of cases) {
  test(`${slug}: known result and empty input`, async ({ page }) => {
    await page.goto(`/tools/${slug}`);
    await expect(page.getByTestId(output)).toHaveText(expected);
    await page.getByLabel(input, { exact: true }).fill("");
    await expect(page.locator("p[role=alert]")).toBeVisible();
    await expect(page.getByTestId(output)).toHaveCount(0);
  });
}
test("mortgage zero interest and invalid term; tip requires whole people", async ({ page }) => {
  await page.goto("/tools/mortgage-calculator");
  await page.getByLabel("Annual interest percent").fill("0");
  await page.getByLabel("Loan principal").fill("1200");
  await page.getByLabel("Loan term years").fill("1");
  await expect(page.getByTestId("Monthly payment")).toHaveText("100.00");
  await page.getByLabel("Loan term years").fill("0"); await expect(page.locator("p[role=alert]")).toBeVisible();
  await page.goto("/tools/tip-calculator"); await page.getByLabel("People", { exact: true }).fill("1.5"); await expect(page.locator("p[role=alert]")).toBeVisible();
});
test("scientific operations reject invalid domains without evaluating code", async ({ page }) => {
  await page.goto("/tools/scientific-calculator"); await expect(page.getByTestId("Scientific result")).toHaveText("12");
  await page.getByLabel("Operation", { exact: true }).selectOption("Divide"); await page.getByLabel("Second operand").fill("0"); await expect(page.locator("p[role=alert]")).toBeVisible();
  await page.getByLabel("Operation", { exact: true }).selectOption("Square root"); await page.getByLabel("First operand").fill("81"); await expect(page.getByTestId("Scientific result")).toHaveText("9");
  await page.getByLabel("First operand").fill("-1"); await expect(page.locator("p[role=alert]")).toBeVisible();
});
test("date comparison and adjustment use calendar days across DST", async ({ page }) => {
  await page.goto("/tools/date-calculator"); await page.getByLabel("Start date").fill("2026-03-07"); await page.getByLabel("End date").fill("2026-03-09");
  await expect(page.getByTestId("Elapsed days")).toHaveText("2 days");
  await page.getByLabel("Days to add or subtract").fill("-7"); await expect(page.getByTestId("Adjusted date")).toHaveText("2026-02-28");
  await page.getByLabel("End date").fill(""); await expect(page.locator("p[role=alert]")).toBeVisible();
});
test("area and storage conversions distinguish decimal and binary units", async ({ page }) => {
  await page.goto("/tools/area-converter"); await expect(page.getByTestId("Converted value")).toHaveText("10.7639104167 Square feet");
  await page.getByLabel("Value", { exact: true }).fill("-1"); await expect(page.locator("p[role=alert]")).toBeVisible();
  await page.goto("/tools/data-storage-converter"); await page.getByLabel("To unit").selectOption("KiB"); await expect(page.getByTestId("Converted value")).toHaveText("1 KiB");
  await page.getByLabel("To unit").selectOption("KB"); await expect(page.getByTestId("Converted value")).toHaveText("1.024 KB");
  await page.getByLabel("Value", { exact: true }).fill(""); await expect(page.locator("p[role=alert]")).toBeVisible();
});
test("timezone converts explicit instants through the DST spring gap", async ({ page }) => {
  await page.goto("/tools/time-zone-converter"); await page.getByLabel("UTC instant (ISO 8601)").fill("2026-03-08T06:59:00Z");
  await expect(page.getByTestId("Local time")).toContainText("01:59:00 GMT-05:00");
  await page.getByLabel("UTC instant (ISO 8601)").fill("2026-03-08T07:00:00Z"); await expect(page.getByTestId("Local time")).toContainText("03:00:00 GMT-04:00");
  await page.getByLabel("UTC instant (ISO 8601)").fill("2026-03-08T02:30:00"); await expect(page.locator("p[role=alert]")).toBeVisible();
});

test("margin pricing solves target margin and rejects 100 percent", async ({ page }) => {
  await page.goto("/tools/margin-calculator");
  await page.getByLabel("Pricing calculation").selectOption("price");
  await expect(page.getByTestId("Required selling price")).toHaveText("100.00");
  await page.getByLabel("Target margin percent").fill("100");
  await expect(page.locator("p[role=alert]")).toBeVisible();
});
