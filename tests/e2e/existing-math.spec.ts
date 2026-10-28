import { test, expect } from "@playwright/test";

test("age clamps leap anniversaries and handles early years without 1900 offset", async ({ page }) => {
  await page.goto("/tools/age-calculator");
  await page.getByLabel("Date of Birth").fill("2024-02-29"); await page.getByLabel("As of date").fill("2025-02-28");
  await expect(page.getByTestId("age-years")).toHaveText("1"); await expect(page.getByTestId("age-months")).toHaveText("0"); await expect(page.getByTestId("age-days")).toHaveText("0"); await expect(page.getByTestId("age-totalDays")).toHaveText("365");
  await page.getByLabel("Date of Birth").fill("0099-01-31"); await page.getByLabel("As of date").fill("0100-02-28");
  await expect(page.getByTestId("age-years")).toHaveText("1"); await expect(page.getByTestId("age-months")).toHaveText("1");
  await page.getByLabel("As of date").fill("0098-01-01"); await expect(page.locator("p[role=alert]")).toBeVisible();
  await page.getByLabel("Date of Birth").fill(""); await expect(page.getByTestId("age-years")).toHaveCount(0);
});
test("BMI and percentage reject empty and invalid inputs without fabricated zero", async ({ page }) => {
  await page.goto("/tools/bmi-calculator"); await expect(page.getByTestId("bmi-result")).toHaveText("22.9");
  await page.getByLabel("Weight (kg)").fill("-1"); await expect(page.locator("p[role=alert]")).toBeVisible();
  await page.getByLabel("Weight (kg)").fill("70"); await page.getByLabel("Height (cm)").fill(""); await expect(page.getByTestId("bmi-result")).toHaveCount(0);
  await page.goto("/tools/percentage-calculator"); await expect(page.getByTestId("percentage-result")).toHaveText("30.00");
  await page.getByLabel("What is (%)").fill("0"); await expect(page.getByTestId("percentage-result")).toHaveText("0.00");
  await page.getByLabel("Of Amount").fill(""); await expect(page.locator("p[role=alert]")).toBeVisible();
});
for (const slug of ["emi-calculator", "loan-calculator"]) test(`${slug} zero interest, fractional years and zero tenure`, async ({ page }) => {
  await page.goto(`/tools/${slug}`); await page.getByLabel("Loan Amount").fill("1200"); await page.getByLabel("Interest Rate (% per year)").fill("0"); await page.getByLabel("Tenure (Years)").fill("0.5");
  await expect(page.getByTestId("emi")).toHaveText("$200.00"); await expect(page.getByTestId("totalInterest")).toHaveText("$0.00");
  await page.getByLabel("Tenure (Years)").fill("0"); await expect(page.locator("p[role=alert]")).toBeVisible(); await expect(page.getByTestId("emi")).toHaveCount(0);
  await page.getByLabel("Tenure (Years)").fill("1"); await page.getByLabel("Loan Amount").fill(""); await expect(page.locator("p[role=alert]")).toBeVisible();
});
for (const slug of ["gst-calculator", "vat-calculator"]) test(`${slug} inclusive and exclusive tax, zero rate and empty input`, async ({ page }) => {
  await page.goto(`/tools/${slug}`); await expect(page.getByTestId("gst-total")).toHaveText("$1180.00");
  await page.getByLabel("Tax Mode").selectOption("inclusive"); await page.getByLabel("Amount ($)").fill("1180"); await expect(page.getByTestId("gst-netAmount")).toHaveText("$1000.00"); await expect(page.getByTestId("gst-tax")).toHaveText("$180.00");
  await page.getByLabel("Tax Rate (%)").fill("0"); await expect(page.getByTestId("gst-tax")).toHaveText("$0.00");
  await page.getByLabel("Tax Rate (%)").fill("-100"); await expect(page.locator("p[role=alert]")).toBeVisible(); await page.getByLabel("Tax Rate (%)").fill(""); await expect(page.getByTestId("gst-tax")).toHaveCount(0);
});
for (const [slug, output, expected] of [["length-converter", "unit-ft", "3.2808"], ["weight-converter", "unit-lb", "2.2046"]]) test(`${slug} exact units and empty/negative inputs`, async ({ page }) => {
  await page.goto(`/tools/${slug}`); await expect(page.getByTestId(output)).toHaveText(expected);
  await page.getByLabel("Value", { exact: true }).fill("0"); await expect(page.getByTestId(output)).toHaveText("0.0000");
  await page.getByLabel("Value", { exact: true }).fill("-1"); await expect(page.locator("p[role=alert]")).toBeVisible();
  await page.getByLabel("Value", { exact: true }).fill(""); await expect(page.getByTestId(output)).toHaveCount(0);
});
test("temperature respects absolute zero and empty input", async ({ page }) => {
  await page.goto("/tools/temperature-converter"); await expect(page.getByTestId("fahrenheit")).toHaveText("77.0°F");
  await page.getByLabel("Temperature in Celsius (°C)").fill("-273.15"); await expect(page.getByTestId("kelvin")).toHaveText("0.00K");
  await page.getByLabel("Temperature in Celsius (°C)").fill("-274"); await expect(page.locator("p[role=alert]")).toBeVisible();
  await page.getByLabel("Temperature in Celsius (°C)").fill(""); await expect(page.getByTestId("kelvin")).toHaveCount(0);
});
test("binary converter uses UTF-8 bytes for Unicode and supports empty text", async ({ page }) => {
  await page.goto("/tools/binary-converter"); await page.getByLabel("Input Text").fill("é🙂");
  await expect(page.locator("pre").nth(0)).toHaveText("11000011 10101001 11110000 10011111 10011001 10000010"); await expect(page.locator("pre").nth(1)).toHaveText("c3 a9 f0 9f 99 82");
  await page.getByLabel("Input Text").fill(""); await expect(page.locator("pre").nth(0)).toHaveText("");
});
test("Roman conversion requires a bounded integer", async ({ page }) => {
  await page.goto("/tools/roman-numeral-converter"); const input = page.getByLabel("Integer (1 - 3999)");
  await input.fill("1994"); await expect(page.getByText("MCMXCIV", { exact: true })).toBeVisible();
  for (const value of ["1.5", "0", "4000", ""]) { await input.fill(value); await expect(page.locator("p[role=alert]")).toBeVisible(); }
});
