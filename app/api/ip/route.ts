import { NextRequest, NextResponse } from "next/server";
import { requireToolAccess } from "@/lib/server/tool-access";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { isIP } from "node:net";
import { safeRequest } from "@/lib/server/safe-request";
import { isSafeTarget, resolveSafeTarget } from "@/lib/server/ssrf";
import { getCached, setCached } from "@/lib/server/cache";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "network:ip-lookup", 30);
  if (limited) return limited;
  const access = await requireToolAccess("ip-lookup", { inputChars: (new URL(req.url).searchParams.get("query") || new URL(req.url).searchParams.get("domain") || "").length });
  if ("response" in access) return access.response;
  const timeoutMs = Math.min(access.status.timeoutMs ?? 8000, 30000);

  const { searchParams } = new URL(req.url);
  const target = searchParams.get("query") || searchParams.get("domain") || "";

  const input = target.trim();
  if (!input || /[\/\s?#@]/.test(input) || (!isIP(input) && !/^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/.test(input))) {
    return NextResponse.json({ success: false, error: "Enter a public IP address or domain" }, { status: 400 });
  }
  let ip: string;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const targetUrl = isIP(input) === 6 ? `https://[${input}]` : `https://${input}`;
    const check = isSafeTarget(targetUrl);
    if (!check.safe) throw new Error("Enter a public IP address or domain");
    const approved = await Promise.race([resolveSafeTarget(targetUrl), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("IP resolution timed out")), timeoutMs); })]);
    ip = approved.address.address;
  } catch {
    return NextResponse.json({ success: false, error: "Target could not be resolved to a public IP address" }, { status: 400 });
  } finally { clearTimeout(timer); }
  const cacheKey = `ip_${ip}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return NextResponse.json({ success: true, info: cached, cached: true });
  }

  try {
    const res = await safeRequest(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      timeoutMs, maxBytes: 64000,
      headers: { "User-Agent": "ToolsPlatform/1.0" },
    });

    if (!res.ok) {
      throw new Error(`IP service error: ${res.status}`);
    }

    const data = JSON.parse(res.body.toString("utf8"));
    if (!data || data.error || typeof data.ip !== "string" || !isIP(data.ip) || data.ip !== ip || (data.latitude != null && (typeof data.latitude !== "number" || !Number.isFinite(data.latitude))) || (data.longitude != null && (typeof data.longitude !== "number" || !Number.isFinite(data.longitude)))) throw new Error("Invalid IP provider response");
    const field = (value: unknown, fallback = "Unknown") => typeof value === "string" ? value.slice(0, 300) : fallback;
    const info = {
      ip: data.ip,
      city: field(data.city),
      region: field(data.region),
      country: field(data.country_name, field(data.country)),
      countryCode: field(data.country_code, ""),
      org: field(data.org, field(data.asn, "Unknown ISP")),
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: field(data.timezone, ""),
    };

    setCached(cacheKey, info, 3600);
    return NextResponse.json({ success: true, info, cached: false });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof SyntaxError ? "Invalid IP provider response" : "IP lookup provider unavailable" },
      { status: 502 }
    );
  }
}
