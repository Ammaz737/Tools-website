import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const report = JSON.parse(readFileSync('docs/cross-browser-results.json', 'utf8'));
const initial = JSON.parse(readFileSync('docs/cross-browser-before-fix-passes.json', 'utf8'));
const rows = new Map();
const key = (project, file, title) => `${project}:${file.replace(/\\/g, '/').split('/').pop().replace(/:\d+:\d+$/, '')}:${title}`;
for (const row of initial.passed.filter(row => row.project === 'firefox')) rows.set(key(row.project, row.file, row.title), row);
function visit(suite) {
  for (const spec of suite.specs || []) for (const test of spec.tests || []) {
    const last = test.results?.at(-1);
    const row = { project: test.projectName, file: spec.file || suite.file, title: spec.title, status: last?.status === 'passed' ? 'PASS' : (last?.status || 'NOT_RUN').toUpperCase() };
    rows.set(key(row.project, row.file, row.title), row);
  }
  for (const nested of suite.suites || []) visit(nested);
}
for (const suite of report.suites) visit(suite);
const webkitRecheck = JSON.parse(readFileSync('docs/cross-browser-webkit-recheck-results.json', 'utf8'));
for (const suite of webkitRecheck.suites) visit(suite);
const focused = JSON.parse(readFileSync('docs/cross-browser-firefox-focused-results.json', 'utf8'));
for (const suite of focused.suites) visit(suite);
const results = [...rows.values()];
const counts = Object.fromEntries(['firefox', 'webkit'].map(project => [project, {
  total: results.filter(row => row.project === project).length,
  passed: results.filter(row => row.project === project && row.status === 'PASS').length,
  unresolved: results.filter(row => row.project === project && row.status !== 'PASS').length,
}]));
const summary = {
  checkedAt: new Date().toISOString(), buildId: readFileSync('.next/BUILD_ID', 'utf8').trim(),
  scope: 'Firefox full164 latest outcomes before the shared hydration fix, plus targeted current-build regressions including two new readiness scenarios. WebKit current-build full166 run:165 passed; the Office transport test was repaired to verify actual bytes at a loopback receiver and passed on targeted recheck. Prior failures/resource-pressure interruption remain in logs. No single uninterrupted Firefox run or every Safari/device certification is claimed. Live integrations are disabled in browser suites and verified separately.',
  priorBuildId: initial.buildId, priorFirefoxPasses: initial.passed.filter(row => row.project === 'firefox').length, webkitStats: report.stats, webkitRecheckStats: webkitRecheck.stats, focusedFirefoxStats: focused.stats, counts,
  lockfileSha256: createHash('sha256').update(readFileSync('package-lock.json')).digest('hex'),
  failures: results.filter(row => row.status !== 'PASS'),
};
writeFileSync('docs/cross-browser-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(counts));
if (summary.failures.length || results.length !== 332 || report.errors?.length || webkitRecheck.errors?.length || focused.errors?.length) process.exitCode = 1;
