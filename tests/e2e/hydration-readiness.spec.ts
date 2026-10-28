import { test, expect } from '@playwright/test';

test('tool controls remain disabled until delayed application scripts hydrate', async ({ page }) => {
  let release = () => undefined as void;
  const scriptsReady = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, async route => { await scriptsReady; await route.continue(); });
  try {
    await page.goto('/tools/area-converter', { waitUntil: 'commit' });
    const value = page.getByLabel('Value', { exact: true });
    await expect(value).toBeVisible();
    await expect(value).toBeDisabled();
    await expect(page.locator('[data-tool-workspace]')).toHaveAttribute('aria-busy', 'true');
    release();
    await expect(value).toBeEnabled({ timeout: 30000 });
    await value.fill('-1');
    await expect(page.locator('p[role=alert]')).toBeVisible();
    await expect(page.getByTestId('Converted value')).toHaveCount(0);
    await value.fill('2');
    await expect(page.getByTestId('Converted value')).toHaveText('21.5278208334 Square feet');
  } finally { release(); }
});

test('immediate text processing retains the first entered value', async ({ page }) => {
  await page.goto('/tools/xml-formatter');
  await page.getByLabel('Source text').fill('<root><a>1</a><b>2</b></root>');
  await page.getByRole('button', { name: 'Process', exact: true }).click();
  await expect(page.getByTestId('developer-result')).toContainText('\n  <a>1</a>');
});
