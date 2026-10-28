import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Keep evidence separate from the completed Chromium report.
export default defineConfig({
  ...base,
  reporter: [['list'], ['json', { outputFile: process.env.CROSS_BROWSER_REPORT || 'docs/cross-browser-results.json' }]],
  outputDir: 'test-results/cross-browser',
  use: { ...base.use, channel: undefined },
  projects: [
    { name: 'firefox', use: { browserName: 'firefox', launchOptions: {
      firefoxUserPrefs: { 'dom.ipc.processCount': 2, 'dom.ipc.processCount.webIsolated': 1, 'dom.ipc.processPrelaunch.enabled': false },
    } } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
