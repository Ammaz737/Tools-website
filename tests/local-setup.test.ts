import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";

test("local secret preparation preserves account credentials and is idempotent", async () => {
  const base = path.resolve("tmp/local-setup-tests"); await mkdir(base, { recursive: true });
  const directory = await mkdtemp(path.join(base, "config-"));
  await writeFile(path.join(directory, ".env.example"), "ADMIN_PASSWORD=\nADMIN_SESSION_SECRET=\nCOPYLEAKS_WEBHOOK_SECRET=\nOFFICE_CONVERTER_USERNAME=\nOFFICE_CONVERTER_PASSWORD=\nOFFICE_CONVERTER_AUTH_HEADER=\nOFFICE_CONVERTER_URL=\nOPENAI_API_KEY=preserve-provider-fixture\n");
  const script = path.resolve("scripts/configure-local.mjs");
  const firstOutput = execFileSync(process.execPath, [script], { cwd: directory, encoding: "utf8" });
  const first = await readFile(path.join(directory, ".env.local"), "utf8"); const values = parseEnv(first);
  for (const name of ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "COPYLEAKS_WEBHOOK_SECRET", "OFFICE_CONVERTER_PASSWORD"]) { const secret = values[name] || ""; assert.equal(secret.length, 43); assert.ok(!firstOutput.includes(secret)); }
  assert.notEqual(values.ADMIN_PASSWORD, values.ADMIN_SESSION_SECRET);
  assert.equal(values.OPENAI_API_KEY, "preserve-provider-fixture");
  assert.equal(values.OFFICE_CONVERTER_AUTH_HEADER, "Basic " + Buffer.from(values.OFFICE_CONVERTER_USERNAME + ":" + values.OFFICE_CONVERTER_PASSWORD).toString("base64"));
  execFileSync(process.execPath, [script], { cwd: directory });
  assert.equal(await readFile(path.join(directory, ".env.local"), "utf8"), first);
});
