import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("random numbers validate bounds, produce integers in range, and download", async ({ page }) => {
  await page.goto("/tools/random-number-generator");
  await page.getByLabel("Minimum", { exact: true }).fill("10"); await page.getByLabel("Maximum", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Generate numbers", exact: true }).click();
  await expect(page.getByText(/Use integer bounds/)).toBeVisible();
  await page.getByLabel("Maximum", { exact: true }).fill("12"); await page.getByLabel("Number count").fill("100");
  await page.getByRole("button", { name: "Generate numbers", exact: true }).click();
  const output = await page.locator("pre").innerText(); const values = output.split("\n").map(Number);
  expect(values).toHaveLength(100); expect(values.every((value) => Number.isInteger(value) && value >= 10 && value <= 12)).toBe(true);
  const ready = page.waitForEvent("download"); await page.getByRole("button", { name: "Download", exact: true }).click();
  expect(await readFile((await (await ready).path())!, "utf8")).toBe(output);
  await page.getByRole("button", { name: "Reset", exact: true }).click(); await expect(page.locator("pre")).toHaveCount(0);
});
for (const id of ["timestamp-converter", "unix-time-converter"]) test(`${id} converts both ways and rejects invalid dates`, async ({ page }) => {
  await page.goto(`/tools/${id}`); await page.getByRole("button", { name: "Convert timestamp", exact: true }).click();
  await expect(page.locator("pre")).toContainText("UTC: 1970-01-01T00:00:00.000Z");
  await page.getByLabel("Timestamp unit").selectOption("milliseconds"); await page.getByLabel("Unix timestamp", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "Convert timestamp", exact: true }).click(); await expect(page.locator("pre")).toContainText("Unix seconds: 1");
  await page.getByLabel("UTC date and time").fill("2024-02-29T00:00:00Z"); await page.getByRole("button", { name: "Convert date", exact: true }).click();
  await expect(page.locator("pre")).toContainText("Unix seconds: 1709164800");
  await page.getByLabel("UTC date and time").fill("2024-02-30T00:00:00Z"); await page.getByRole("button", { name: "Convert date", exact: true }).click();
  await expect(page.getByText("Enter a valid calendar date and time.", { exact: true })).toBeVisible(); await expect(page.locator("pre")).toHaveCount(0);
});
test("dice output contains requested count, bounds, and a correct total", async ({ page }) => {
  await page.goto("/tools/dice-roller"); await page.getByLabel("Dice sides").fill("20"); await page.getByLabel("Dice count").fill("10");
  await page.getByRole("button", { name: "Roll dice", exact: true }).click();
  const values = (await page.getByLabel("Individual rolls").innerText()).split(", ").map(Number);
  expect(values).toHaveLength(10); expect(values.every((value) => value >= 1 && value <= 20)).toBe(true);
  await expect(page.getByText(`Total: ${values.reduce((sum, value) => sum + value, 0)}`, { exact: true })).toBeVisible();
  await page.getByLabel("Dice sides").fill("1"); await page.getByRole("button", { name: "Roll dice", exact: true }).click();
  await expect(page.getByText(/Use 2 to 1,000 sides/)).toBeVisible(); await expect(page.getByLabel("Individual rolls")).toHaveCount(0);
});
test("stopwatch pauses, resumes, records laps and resets", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") }); await page.goto("/tools/stopwatch");
  // Freeze wall time too; runFor alone otherwise leaves real time advancing
  // during slow browser actions and makes exact elapsed-time checks flaky.
  await page.clock.pauseAt(new Date("2026-01-01T02:00:00Z"));
  const output = page.getByLabel("Stopwatch elapsed"); await expect(output).toHaveText("00:00:00.00");
  await page.getByRole("button", { name: "Start stopwatch", exact: true }).click(); await page.clock.runFor(1250);
  await expect(output).toContainText("00:00:01."); await page.getByRole("button", { name: "Record lap", exact: true }).click();
  await expect(page.getByLabel("Stopwatch laps")).toContainText("Lap 1: 00:00:01.");
  await page.getByRole("button", { name: "Pause stopwatch", exact: true }).click(); const paused = await output.innerText();
  await page.clock.runFor(2000); await expect(output).toHaveText(paused);
  await page.getByRole("button", { name: "Start stopwatch", exact: true }).click(); await page.clock.runFor(1000); await expect(output).toContainText("00:00:02.");
  await page.getByRole("button", { name: "Reset stopwatch", exact: true }).click(); await expect(output).toHaveText("00:00:00.00"); await expect(page.getByLabel("Stopwatch laps")).toHaveCount(0);
});
test("countdown validates, pauses, resumes and completes", async ({ page }) => {
  await page.clock.install(); await page.goto("/tools/timer"); await page.getByLabel("Timer duration (seconds)").fill("0");
  await page.getByRole("button", { name: "Start timer", exact: true }).click(); await expect(page.getByText(/Enter a whole duration/)).toBeVisible();
  await page.getByLabel("Timer duration (seconds)").fill("3"); await page.getByRole("button", { name: "Start timer", exact: true }).click();
  await page.clock.runFor(1000); await page.getByRole("button", { name: "Pause timer", exact: true }).click();
  const output = page.getByLabel("Timer remaining"); const paused = await output.innerText(); await page.clock.runFor(5000); await expect(output).toHaveText(paused);
  await page.getByRole("button", { name: "Resume timer", exact: true }).click(); await page.clock.runFor(3000);
  await expect(output).toHaveText("00:00:00"); await expect(page.getByText("Timer complete", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset timer", exact: true }).click(); await expect(page.getByText("Timer complete", { exact: true })).toHaveCount(0);
});
test("tasks persist completion after reload, export and clear completed", async ({ page }) => {
  await page.goto("/tools/todo-list-online"); await page.getByLabel("New task").fill("Review regression report"); await page.getByRole("button", { name: "Add task", exact: true }).click();
  const checkbox = page.getByRole("checkbox", { name: "Review regression report", exact: true }); await checkbox.check(); await page.reload(); await expect(checkbox).toBeChecked();
  const ready = page.waitForEvent("download"); await page.getByRole("button", { name: "Download tasks", exact: true }).click();
  expect(await readFile((await (await ready).path())!, "utf8")).toBe("[x] Review regression report");
  await page.getByRole("button", { name: "Clear completed", exact: true }).click(); await expect(checkbox).toHaveCount(0); await expect(page.getByText("0 tasks remaining", { exact: true })).toBeVisible();
});
test("password checker evaluates locally, supports reveal and clears sensitive output", async ({ page }) => {
  await page.goto("/tools/password-strength-checker"); const input = page.getByLabel("Password to check");
  await input.fill("password123"); await expect(page.getByLabel("Password rating")).toHaveText("Weak");
  await input.fill("4j!N7#pZ9@qL3$mX"); await expect(page.getByLabel("Password rating")).toHaveText("Strong");
  await expect(input).toHaveAttribute("type", "password"); await page.getByRole("button", { name: "Show password", exact: true }).click(); await expect(input).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Clear password", exact: true }).click(); await expect(input).toHaveValue(""); await expect(page.getByLabel("Password rating")).toHaveCount(0);
});
