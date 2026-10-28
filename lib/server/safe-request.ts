import http from "node:http";
import https from "node:https";
import { resolveSafeTarget, type Resolver } from "./ssrf";

export type SafeResponse = { status: number; statusText: string; ok: boolean; headers: Headers; body: Buffer; url: string };
export type SafeRequestOptions = { method?: "GET" | "HEAD"; headers?: Record<string, string>; timeoutMs?: number; maxBytes?: number; maxRedirects?: number; resolver?: Resolver };
let active = 0;
const MAX_ACTIVE = 24;

/** Each hop resolves once and pins that approved address at socket creation. */
export async function safeRequest(input: string, options: SafeRequestOptions = {}): Promise<SafeResponse> {
  if (active >= MAX_ACTIVE) throw new Error("Outbound request capacity exceeded");
  active++;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Request timed out")), options.timeoutMs ?? 8000);
  try {
    const aborted = new Promise<never>((_, reject) => controller.signal.addEventListener("abort", () => reject(new Error("Request timed out")), { once: true }));
    let target = input;
    for (let redirects = 0; ; redirects++) {
      const approved = await Promise.race([resolveSafeTarget(target, options.resolver), aborted]);
      const response = await new Promise<SafeResponse>((resolve, reject) => {
        const request = (approved.url.protocol === "https:" ? https : http).request(approved.url, {
          method: options.method ?? "GET", agent: false, signal: controller.signal,
          headers: { "User-Agent": "ToolsPlatform/1.0", "Accept-Encoding": "identity", ...options.headers },
          lookup: (_hostname, lookupOptions, callback) => {
            // Node autoSelectFamily requests an array; preserve the validated pin.
            if (lookupOptions.all) callback(null, [approved.address]);
            else callback(null, approved.address.address, approved.address.family);
          },
          // URL hostname remains the Host header, SNI name, and certificate identity.
          rejectUnauthorized: true,
        }, (incoming) => {
          const chunks: Buffer[] = [];
          let size = 0;
          const limit = options.maxBytes ?? 2 * 1024 * 1024;
          incoming.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > limit) {
              incoming.destroy(new Error("Response exceeds byte limit"));
              request.destroy(new Error("Response exceeds byte limit"));
              return;
            }
            chunks.push(chunk);
          });
          incoming.on("error", reject);
          incoming.on("aborted", () => reject(new Error("Response aborted")));
          incoming.on("end", () => {
            const headers = new Headers();
            for (const [key, value] of Object.entries(incoming.headers)) {
              if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
            }
            const status = incoming.statusCode ?? 0;
            resolve({ status, statusText: incoming.statusMessage ?? "", ok: status >= 200 && status < 300, headers, body: Buffer.concat(chunks), url: approved.url.toString() });
          });
        });
        request.on("error", reject);
        request.end();
      });
      const location = response.headers.get("location");
      if (![301, 302, 303, 307, 308].includes(response.status) || !location) return response;
      if (redirects >= (options.maxRedirects ?? 4)) throw new Error("Too many redirects");
      target = new URL(location, approved.url).toString();
    }
  } finally {
    clearTimeout(timer);
    active--;
  }
}
