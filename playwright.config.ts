import { defineConfig } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Keep Windows browser profiles, upload backing files and downloads inside the
// writable workspace rather than an externally restricted temporary directory.
const browserRuntime = path.resolve("tmp/playwright-runtime");
mkdirSync(browserRuntime, { recursive: true });
if (process.platform === "win32") { process.env.TEMP = browserRuntime; process.env.TMP = browserRuntime; }

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "test-results/browser-results.json" }]],
  use: { baseURL: "http://127.0.0.1:3100", channel: "chromium", acceptDownloads: true, launchOptions: { downloadsPath: browserRuntime }, trace: "retain-on-failure" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      MONGODB_URI: "", ADMIN_PASSWORD: "", ADMIN_SESSION_SECRET: "",
      OFFICE_CONVERTER_URL: "", OFFICE_CONVERTER_AUTH_HEADER: "", COPYLEAKS_EMAIL: "", COPYLEAKS_API_KEY: "", COPYLEAKS_WEBHOOK_SECRET: "",
      AI_PROVIDER: "auto", OPENAI_API_KEY: "", GEMINI_API_KEY: "",
      OLLAMA_BASE_URL: "", OLLAMA_MODEL: "", RATE_LIMIT_IP_HEADER: "",
    },
  },
});
