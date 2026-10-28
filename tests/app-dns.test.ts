import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const preload = pathToFileURL(path.resolve('scripts/app-dns.mjs')).href;
const inspect = 'console.log(JSON.stringify(require("node:dns").getServers()))';
test('application DNS override is opt-in and isolated to its child process', () => {
  const env = { ...process.env }; delete env.APP_DNS_SERVERS;
  const defaults = execFileSync(process.execPath, ['-e', inspect], { env, encoding: 'utf8' });
  const unchanged = execFileSync(process.execPath, ['--import', preload, '-e', inspect], { env, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(unchanged), JSON.parse(defaults));
  const configured = execFileSync(process.execPath, ['--import', preload, '-e', inspect], { env: { ...env, APP_DNS_SERVERS: '1.1.1.1, 1.0.0.1' }, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(configured), ['1.1.1.1', '1.0.0.1']);
  assert.equal(execFileSync(process.execPath, ['-e', inspect], { env, encoding: 'utf8' }), defaults);
});
test('invalid application resolver configuration fails before server startup', () => {
  const result = spawnSync(process.execPath, ['--import', preload, '-e', inspect], { env: { ...process.env, APP_DNS_SERVERS: 'invalid-dns-secret-fixture' }, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /APP_DNS_SERVERS must contain/);
  assert.ok(!result.stderr.includes('invalid-dns-secret-fixture'));
});
