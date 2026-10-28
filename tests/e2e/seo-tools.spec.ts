import { test, expect } from "@playwright/test";

test("meta tags escape user HTML and reset clears output", async ({ page }) => {
  await page.goto("/tools/meta-tag-generator");
  await page.getByLabel("Page title", { exact: true }).fill('<img src=x onerror="alert(1)">');
  await page.getByLabel("Description", { exact: true }).fill('Research & "notes"');
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByTestId("seo-output")).toContainText("&lt;img");
  await expect(page.getByTestId("seo-output")).toContainText("&amp;");
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Reset inputs" }).click();
  await expect(page.getByTestId("seo-output")).toHaveCount(0);
});
test("robots directives generate a downloadable text file", async ({ page }) => {
  await page.goto("/tools/robots-txt-generator");
  await page.getByLabel("Disallow paths (one per line)").fill("/private/\n/cart/");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByTestId("seo-output")).toContainText("Disallow: /cart/");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download/ }).click();
  expect((await download).suggestedFilename()).toBe("robots.txt");
});
test("sitemap escapes query parameters and rejects mixed origins", async ({ page }) => {
  await page.goto("/tools/sitemap-generator");
  const input = page.getByLabel("Page URLs (one per line)");
  await input.fill("https://example.com/?a=1&b=2\nhttps://example.com/about");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByTestId("seo-output")).toContainText("a=1&amp;b=2");
  const xml = await page.getByTestId("seo-output").innerText();
  expect(await page.evaluate((value) => new DOMParser().parseFromString(value, "application/xml").querySelectorAll("parsererror").length, xml)).toBe(0);
  await input.fill("https://example.com/\nhttps://other.example/");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toContainText("same site origin");
});
test("density counts words and phrase occurrences", async ({ page }) => {
  await page.goto("/tools/keyword-density-checker");
  await page.getByLabel("Article text").fill("Blue sky blue sky red");
  await page.getByLabel("Target keyword or phrase (optional)").fill("blue sky");
  await page.getByRole("button", { name: "Analyze text", exact: true }).click();
  await expect(page.getByTestId("seo-output")).toContainText("Total words: 5");
  await expect(page.getByTestId("seo-output")).toContainText("Occurrences: 2");
  await expect(page.getByTestId("seo-output")).toContainText("40.00%");
});
test("SERP preview displays text without injecting markup", async ({ page }) => {
  await page.goto("/tools/serp-preview-tool");
  await page.getByLabel("Page title", { exact: true }).fill("<b>Example</b>");
  await page.getByLabel("Page URL", { exact: true }).fill("https://example.com/");
  await page.getByRole("button", { name: "Preview result", exact: true }).click();
  await expect(page.getByTestId("serp-preview")).toContainText("<b>Example</b>");
  await expect(page.getByTestId("serp-preview").locator("b")).toHaveCount(0);
});
test("Open Graph validates URL protocols and escapes properties", async ({ page }) => {
  await page.goto("/tools/open-graph-generator");
  await page.getByLabel("Page title", { exact: true }).fill('Example "site"');
  await page.getByLabel("Page URL", { exact: true }).fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toContainText("HTTP or HTTPS");
  await page.getByLabel("Page URL", { exact: true }).fill("https://example.com/");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByTestId("seo-output")).toContainText("&quot;site&quot;");
});
test("canonical removes fragments and rejects credentials", async ({ page }) => {
  await page.goto("/tools/canonical-tag-generator");
  await page.getByLabel("Page URL", { exact: true }).fill("https://example.com/page#section");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByTestId("seo-output")).toHaveText('<link rel="canonical" href="https://example.com/page">');
  await page.getByLabel("Page URL", { exact: true }).fill("https://user:secret@example.com");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toContainText("without credentials");
});
test("schema emits parseable script-safe JSON and product offers", async ({ page }) => {
  await page.goto("/tools/schema-markup-generator");
  await page.getByLabel("Name or headline").fill("</script><script>alert(1)</script>");
  await page.getByLabel("Page URL", { exact: true }).fill("https://example.com/product");
  await page.getByLabel("Schema type").selectOption("Product");
  await page.getByLabel("Price (optional)").fill("19.99");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  const text = await page.getByTestId("seo-output").innerText();
  expect(text).not.toContain("</script>");
  const value = JSON.parse(text);
  expect(value["@type"]).toBe("Product");
  expect(value.offers.price).toBe(19.99);
  expect(value.name).toContain("</script>");
});
