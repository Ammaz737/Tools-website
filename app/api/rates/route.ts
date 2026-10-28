import { safeRequest } from "@/lib/server/safe-request";
import { NextRequest, NextResponse } from "next/server";
import { requireToolAccess } from "@/lib/server/tool-access";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { getCached, setCached } from "@/lib/server/cache";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "network:currency-converter", 30);
  if (limited) return limited;
  const access = await requireToolAccess("currency-converter", { inputChars: new URL(req.url).searchParams.get("")?.length ?? 0 });
  if ("response" in access) return access.response;
  const timeoutMs = Math.min(access.status.timeoutMs ?? 8000, 30000);

  const cacheKey = "currency_rates_usd";
  const cachedRates = getCached<{ rates: Record<string, number>; updatedAt: string; nextUpdateAt: string | null; source: string }>(cacheKey);

  if (cachedRates) {
    return NextResponse.json({ success: true, base: "USD", ...cachedRates, cached: true });
  }

  try {
    // Fetch rates from open API endpoint
    const res = await safeRequest("https://open.er-api.com/v6/latest/USD", { timeoutMs, maxBytes: 100000 });
    if (!res.ok) {
      throw new Error(`Failed to fetch rates: ${res.statusText}`);
    }

    const data = JSON.parse(res.body.toString("utf8"));
    if (data?.result === "success" && data.base_code === "USD" && data.rates && typeof data.rates === "object" && !Array.isArray(data.rates) && data.rates.USD === 1 && Object.entries(data.rates).every(([currency, rate]) => /^[A-Z]{3}$/.test(currency) && typeof rate === "number" && Number.isFinite(rate) && rate > 0)) {
      const updated = Number(data.time_last_update_unix) * 1000;
      if (!Number.isFinite(updated) || updated <= 0 || updated > Date.now() + 300000 || Date.now() - updated > 72 * 3600000) throw new Error("Exchange rates are missing a current publication timestamp");
      const next = Number(data.time_next_update_unix) * 1000;
      const payload = { rates: data.rates, updatedAt: new Date(updated).toISOString(), nextUpdateAt: Number.isFinite(next) && next > updated && next < updated + 7 * 86400000 ? new Date(next).toISOString() : null, source: "ExchangeRate-API" };
      setCached(cacheKey, payload, 3600); // Provider updates daily; retain publication metadata.
      return NextResponse.json({ success: true, base: "USD", ...payload, cached: false });
    }

    throw new Error("Invalid exchange rate payload");
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Exchange rates unavailable" }, { status: 502 });
  }
}
