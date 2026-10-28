import { safeRequest } from "@/lib/server/safe-request";
import { NextRequest, NextResponse } from "next/server";
import { requireToolAccess } from "@/lib/server/tool-access";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { isSafeTarget } from "@/lib/server/ssrf";
import { getCached, setCached } from "@/lib/server/cache";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "network:whois-lookup", 30);
  if (limited) return limited;
  const access = await requireToolAccess("whois-lookup", { inputChars: new URL(req.url).searchParams.get("domain")?.length ?? 0 });
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
  const cacheKey = `whois_${domain}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return NextResponse.json({ success: true, domain, whois: cached, cached: true });
  }

  try {
    const rdapRes = await safeRequest(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      timeoutMs, maxBytes: 512000,
      headers: { Accept: "application/rdap+json, application/json" },
    });

    if (rdapRes.ok) {
      const data = JSON.parse(rdapRes.body.toString("utf8"));
      if (!data || data.objectClassName !== "domain" || typeof data.ldhName !== "string" || data.ldhName.toLowerCase() !== domain) throw new Error("Invalid RDAP provider response");
      const events: Record<string, string> = {};
      if (Array.isArray(data.events)) {
        for (const evt of data.events) {
          if (evt && typeof evt.eventAction === "string" && typeof evt.eventDate === "string") {
            events[evt.eventAction] = evt.eventDate;
          }
        }
      }

      const info = {
        domain: data.ldhName || domain,
        handle: typeof data.handle === "string" ? data.handle.slice(0, 300) : "N/A",
        status: Array.isArray(data.status) ? data.status.filter((value: unknown) => typeof value === "string").join(", ").slice(0, 1000) : "Not provided",
        registrationDate: events.registration || events["submission"] || "N/A",
        expirationDate: events.expiration || "N/A",
        lastChanged: events["last changed"] || events["last update"] || "N/A",
        nameservers: Array.isArray(data.nameservers)
          ? data.nameservers.map((ns: { ldhName?: string } | null) => typeof ns?.ldhName === "string" ? ns.ldhName.slice(0, 253) : "").filter(Boolean)
          : [],
      };

      setCached(cacheKey, info, 3600);
      return NextResponse.json({ success: true, domain, whois: info, cached: false });
    }

    return NextResponse.json({ success: false, error: `RDAP lookup unavailable (status ${rdapRes.status})` }, { status: rdapRes.status === 404 ? 404 : 502 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof SyntaxError ? "Invalid RDAP provider response" : "WHOIS lookup provider unavailable" },
      { status: 502 }
    );
  }
}
