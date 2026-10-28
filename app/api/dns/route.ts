import { NextRequest, NextResponse } from "next/server";
import { requireToolAccess } from "@/lib/server/tool-access";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { createNetworkResolver } from "@/lib/server/dns-resolver";
import { isSafeTarget } from "@/lib/server/ssrf";
import { getCached, setCached } from "@/lib/server/cache";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "network:dns-lookup", 30);
  if (limited) return limited;
  const access = await requireToolAccess("dns-lookup", { inputChars: new URL(req.url).searchParams.get("domain")?.length ?? 0 });
  if ("response" in access) return access.response;
  const timeoutMs = Math.min(access.status.timeoutMs ?? 8000, 30000);

  const { searchParams } = new URL(req.url);
  const target = searchParams.get("domain") || "";

  const check = isSafeTarget(target);
  if (!check.safe || !check.domain) {
    return NextResponse.json({ success: false, error: check.reason || "Invalid domain target" }, { status: 400 });
  }

  const domain = check.domain;
  if (!/^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(domain)) return NextResponse.json({ success: false, error: "Enter a valid domain name" }, { status: 400 });
  const cacheKey = `dns_${domain}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return NextResponse.json({ success: true, domain, records: cached, cached: true });
  }

  try {
    const resolver = createNetworkResolver(timeoutMs);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const results: Record<string, unknown> = {};
    try {
      const queries = { A: () => resolver.resolve4(domain), AAAA: () => resolver.resolve6(domain), MX: () => resolver.resolveMx(domain), TXT: () => resolver.resolveTxt(domain), NS: () => resolver.resolveNs(domain), CNAME: () => resolver.resolveCname(domain) };
      await Promise.race([
        Promise.all(Object.entries(queries).map(async ([key, query]) => {
          try { results[key] = await query(); }
          catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (code !== "ENODATA" && code !== "ENOTFOUND") throw new Error("DNS service could not complete the lookup");
            results[key] = [];
          }
        })),
        new Promise<never>((_, reject) => { timer = setTimeout(() => { resolver.cancel(); reject(new Error("DNS lookup timed out")); }, timeoutMs); }),
      ]);
    } finally { clearTimeout(timer); resolver.cancel(); }

    setCached(cacheKey, results, 900); // 15 mins cache

    return NextResponse.json({
      success: true,
      domain,
      records: results,
      cached: false,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "DNS lookup failed" },
      { status: 500 }
    );
  }
}
