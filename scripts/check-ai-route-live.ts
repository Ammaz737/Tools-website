import { writeFile } from 'node:fs/promises';
import { NextRequest } from 'next/server';

async function main() {
  Object.assign(process.env, { NODE_ENV: 'production' });
  const { POST } = await import('../app/api/ai/route');
  const originalFetch = globalThis.fetch;
  let providerRequests = 0;
  globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
    providerRequests++;
    return originalFetch(...args);
  };
  const start = Date.now();
  try {
    const response = await POST(new NextRequest('http://localhost:3102/api/ai', {
      method: 'POST', headers: { origin: 'http://localhost:3102', 'content-type': 'application/json' },
      body: JSON.stringify({ toolId: 'grammar-checker', task: 'grammar', prompt: 'She go to school every day.' }),
    }));
    const body = await response.json();
    const corrected = typeof body.result === 'string' && /she/i.test(body.result) && /goes/i.test(body.result);
    const report = {
      checkedAt: new Date().toISOString(), status: response.status,
      integration: response.status === 200 && corrected ? 'SCOPED_PASS' : 'BLOCKED',
      failClosed: response.status === 503 && providerRequests === 0,
      providerRequests, durationMs: Date.now() - start,
      scope: 'Actual production-mode POST handler, same-origin synthetic prompt, configured Atlas/provider. No mocks. At most one provider request. No secret/header/response body recorded.',
    };
    await writeFile('docs/ai-production-route-live-results.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
  } finally {
    globalThis.fetch = originalFetch;
    const cache = globalThis as typeof globalThis & { _workshopMongo?: { promise: Promise<{ close(): Promise<void> }> } };
    await cache._workshopMongo?.promise.then(client => client.close()).catch(() => {});
  }
}
void main().catch(() => { console.error('Production AI check could not complete; private details omitted'); process.exitCode = 1; });
