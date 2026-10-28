import nextEnv from '@next/env';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const mode = process.argv[2];
if (!['dev', 'start'].includes(mode)) throw new Error('Expected Next.js dev or start mode');
nextEnv.loadEnvConfig(process.cwd(), mode === 'dev');
const child = spawn(process.execPath, [
  '--import', new URL('./app-dns.mjs', import.meta.url).href,
  fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)),
  mode, ...process.argv.slice(3),
], { stdio: 'inherit', env: process.env });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', () => { console.error('Next.js startup failed'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
