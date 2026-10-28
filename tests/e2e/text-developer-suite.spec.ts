import { test, expect } from "@playwright/test";

for (const [id, label, input, output] of [
  ["remove-duplicate-lines", "Input Lines", "apple\nbanana\napple\nBANANA", "apple\nbanana"],
  ["text-sorter", "Raw Lines", "pear\napple\nbanana", "apple\nbanana\npear"],
  ["text-cleaner", "Raw Input", "<b>Hello</b>   world", "Hello world"],
  ["remove-extra-spaces", "Unformatted Input", "  A   B  \n  C  ", "A B\nC"],
  ["reverse-text", "Input Text", "A👨‍👩‍👧‍👦é", "é👨‍👩‍👧‍👦A"],
  ["base64-encoder", "Plain Text", "Hello اردو🙂", Buffer.from("Hello اردو🙂").toString("base64")],
  ["base64-decoder", "Base64 String", Buffer.from("Hello اردو🙂").toString("base64"), "Hello اردو🙂"],
  ["url-encoder", "Raw Text / URL", "a b&🙂", "a%20b%26%F0%9F%99%82"],
  ["url-decoder", "Encoded URL String", "a%20b%26%F0%9F%99%82", "a b&🙂"],
  ["json-minifier", "Formatted JSON", '{ "value": [1, 2] }', '{"value":[1,2]}'],
] as const) test(`${id}: known output and empty input`, async ({ page }) => {
  await page.goto(`/tools/${id}`);
  const inputField = page.getByLabel(label);
  await inputField.fill(input);
  await expect(page.locator("pre").first()).toHaveText(output);
  await inputField.fill("");
  await expect(page.locator("pre").first()).not.toHaveText(output);
});

for (const [id, label, expected] of [["word-counter", "Words", "3"], ["character-counter", "Total Characters", "22"], ["sentence-counter", "Total Sentences", "2"]] as const) test(`${id}: counts and empty reset`, async ({ page }) => {
  await page.goto(`/tools/${id}`); await page.getByLabel("Input Text").fill("Hello world. Goodbye! ");
  const metric = page.getByText(label, { exact: true }).locator("..").locator("span").first();
  await expect(metric).toHaveText(expected);
  await page.getByLabel("Input Text").fill(""); await expect(metric).toHaveText("0");
});

for (const id of ["uuid-generator", "uuid-generator-util"]) test(`${id}: valid unique IDs and bounded quantity`, async ({ page }) => {
  await page.goto(`/tools/${id}`); const quantity = page.getByLabel("Quantity (1 to 50)"); await quantity.fill("10");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  const values = (await page.locator("pre").innerText()).split("\n"); expect(new Set(values).size).toBe(10);
  for (const value of values) expect(value).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  await quantity.fill("100000"); await expect(page.getByRole("button", { name: "Generate", exact: true })).toBeDisabled();
});

for (const id of ["hash-generator", "md5-generator", "sha256-generator"]) test(`${id}: published known hash vectors`, async ({ page }) => {
  await page.goto(`/tools/${id}`); await page.getByLabel("Text Input").fill("abc"); await page.getByRole("button", { name: "Compute Hashes" }).click();
  await expect(page.locator("pre").nth(0)).toHaveText("900150983cd24fb0d6963f7d28e17f72");
  await expect(page.locator("pre").nth(1)).toHaveText("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("json-validator: valid scalar and malformed syntax", async ({ page }) => {
  await page.goto("/tools/json-validator"); await page.getByLabel("Input JSON").fill("42"); await page.getByRole("button", { name: "Validate JSON" }).click(); await expect(page.getByText("Valid JSON syntax!", { exact: true })).toBeVisible();
  await page.getByLabel("Input JSON").fill("{"); await page.getByRole("button", { name: "Validate JSON" }).click(); await expect(page.getByText("Invalid JSON syntax", { exact: true })).toBeVisible();
});
test("jwt-decoder: claims and malformed token, no verification claim", async ({ page }) => {
  await page.goto("/tools/jwt-decoder"); const token = page.getByLabel("JWT Token Input"); await token.fill(`${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from('{"sub":"123"}').toString("base64url")}.`); await expect(page.locator("pre").nth(1)).toContainText('"sub": "123"');
  await token.fill("bad"); await expect(page.getByText("Invalid JWT format. Must contain 3 dot-separated parts.")).toBeVisible();
});
test("lorem-ipsum-generator: paragraph count and allocation bound", async ({ page }) => {
  await page.goto("/tools/lorem-ipsum-generator"); await page.getByLabel("Paragraphs", { exact: true }).fill("3"); await page.getByRole("button", { name: "Generate", exact: true }).click(); await expect(page.locator("p.whitespace-pre-wrap")).toContainText("Lorem ipsum"); expect((await page.locator("p.whitespace-pre-wrap").innerText()).split("\n\n")).toHaveLength(3);
  await page.getByLabel("Paragraphs", { exact: true }).fill("1000000"); await expect(page.getByRole("button", { name: "Generate", exact: true })).toBeDisabled();
});
test("random-text-generator: allowed characters and bound", async ({ page }) => {
  await page.goto("/tools/random-text-generator"); await page.getByLabel("Length", { exact: true }).fill("20"); await page.getByLabel("Characters Allowed").fill("AB"); await page.getByRole("button", { name: "Generate String" }).click(); await expect(page.locator("pre")).toHaveText(/^[AB]{20}$/);
  await page.getByLabel("Length", { exact: true }).fill("100000000"); await expect(page.getByRole("button", { name: "Generate String" })).toBeDisabled();
});
