import { test, expect } from "@playwright/test";

const scenarios = [
  ["xml-formatter", "<root><a>1</a><b>2</b></root>", "\n  <a>1</a>"],
  ["xml-validator", "<root><a>1</a></root>", "Valid XML syntax."],
  ["html-formatter", "<div><p>Hello</p><p>World</p></div>", "<p>Hello</p>"],
  ["html-minifier", "<p>A  B</p><!-- remove -->", "<p>A  B</p>"],
  ["css-minifier", ".sample { color: red; margin: 0; }", ".sample{color:red;margin:0}"],
  ["javascript-minifier", "// remove\nfunction add(a, b) { return a + b; }", "function add(a,b){return a+b}"],
  ["sql-formatter", "select name from users where id = 1", "SELECT"],
] as const;
for (const [id, input, expected] of scenarios) test(`${id} processes source and clears stale output`, async ({ page }) => {
  await page.goto(`/tools/${id}`);
  await page.getByLabel("Source text").fill(input);
  await page.getByRole("button", { name: "Process", exact: true }).click();
  await expect(page.getByTestId("developer-result")).toContainText(expected);
  if (id === "html-minifier" || id === "javascript-minifier") await expect(page.getByTestId("developer-result")).not.toContainText("remove");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByTestId("developer-result")).toBeEmpty();
  await page.getByRole("button", { name: "Process", exact: true }).click();
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)').filter({ hasText: "Enter source" })).toBeVisible();
  if (id.startsWith("xml")) {
    await page.getByLabel("Source text").fill("<root><a></root>");
    await page.getByRole("button", { name: "Process", exact: true }).click();
    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)').filter({ hasText: "Invalid XML" })).toBeVisible();
  }
});
