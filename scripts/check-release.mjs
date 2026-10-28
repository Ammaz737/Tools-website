import { existsSync, readFileSync } from "node:fs";
import "./check-config.mjs";

// Fail closed on missing evidence. This command performs no deployment.
const checks = [];
const read = (path) => { try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; } };
const matrix = read("docs/tool-test-matrix.json");
const quality = read("docs/output-quality-matrix.json");
checks.push(["Every registered tool has comprehensive output-quality acceptance", Boolean(quality?.tools?.length === 137 && quality.tools.every((tool) => tool.outputQualityStatus === "PASS"))]);
checks.push(["Every registered tool has recorded functional PASS", Boolean(matrix?.tools?.length === 137 && matrix.tools.every((tool) => tool.status === "PASS"))]);
const browser = read("docs/browser-test-results.json");
checks.push(["Full browser run has no failed or skipped scenarios", Boolean(browser?.stats?.expected > 0 && browser.stats.unexpected === 0 && browser.stats.skipped === 0)]);
const lint = read("docs/lint-results.json");
checks.push(["Full lint report has no errors", Boolean(Array.isArray(lint) && lint.length && lint.every((file) => file.errorCount === 0))]);
const audit = read("docs/dependency-audit.json");
checks.push(["Dependency audit has no critical/high findings", Boolean(audit?.metadata?.vulnerabilities && audit.metadata.vulnerabilities.critical === 0 && audit.metadata.vulnerabilities.high === 0)]);
checks.push(["Production build artifact exists", existsSync(".next/BUILD_ID")]);
for (const [name, ok] of checks) console.log(`${ok ? "READY" : "BLOCKED"}: ${name}`);
console.log("Live provider/Atlas, ingress, recovery and operational verification also require recorded staging evidence. Local gates alone do not certify production readiness.");
if (process.exitCode || checks.some(([, ok]) => !ok)) { console.log("RELEASE BLOCKED — do not deploy as a fully verified 137-tool product."); process.exitCode = 1; }
else { console.log("Local automated gates passed. Staging acceptance remains required."); }
