import { isIP } from "node:net";
import { NextResponse } from "next/server";

/** Single-process protection. Use a shared ingress/store before horizontal scaling. */
export function createRateLimiter(maxEntries = 10_000) {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return (key: string, limit: number, windowMs: number, now = Date.now()) => {
    for (const [id, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(id);
    }
    let bucket = buckets.get(key);
    if (!bucket) {
      // Never evict a live bucket: rotating identities must not reset quotas.
      if (buckets.size >= maxEntries) {
        return { allowed: false, retryAfter: Math.max(1, Math.ceil(windowMs / 1000)) };
      }
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    const allowed = bucket.count < limit;
    if (allowed) bucket.count += 1;
    return { allowed, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  };
}

const consume = createRateLimiter();

export function rateLimitIdentity(headers: Headers) {
  // Trust only one operator-configured header, overwritten by the ingress.
  // Without it, a shared bucket is safer than trusting spoofable forwarded IPs.
  const header = process.env.RATE_LIMIT_IP_HEADER?.trim();
  const value = header ? headers.get(header)?.trim() : undefined;
  return value && isIP(value) ? value : "shared";
}

export function enforceRateLimit(request: Request, scope: string, limit: number) {
  const result = consume(`${scope}:${rateLimitIdentity(request.headers)}`, limit, 60_000);
  if (result.allowed) return null;
  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(result.retryAfter), "Cache-Control": "no-store" } },
  );
}
