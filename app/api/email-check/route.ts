import { NextRequest, NextResponse } from "next/server";
import { requireToolAccess } from "@/lib/server/tool-access";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import type { Resolver } from "node:dns/promises";
import { createNetworkResolver } from "@/lib/server/dns-resolver";

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "network:email-validator", 30);
  if (limited) return limited;
  const access = await requireToolAccess("email-validator", { inputChars: new URL(req.url).searchParams.get("email")?.length ?? 0 });
  if ("response" in access) return access.response;
  const timeoutMs = Math.min(access.status.timeoutMs ?? 8000, 30000);

  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").trim();

  const parts = email.split("@");
  const local = parts[0];
  const domain = parts[1]?.toLowerCase();
  const valid = parts.length === 2 && email.length <= 254 && local.length <= 64 &&
    /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local) && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..") &&
    domain && domain.length <= 253 && domain.includes(".") && domain.split(".").every((label) => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label));
  if (!valid) return NextResponse.json({ success: false, error: "Please enter a valid email address format" }, { status: 400 });
  let resolver: Resolver | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    resolver = createNetworkResolver(timeoutMs);
    const activeResolver = resolver;
    const mxRecords = await Promise.race([
      activeResolver.resolveMx(domain),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { activeResolver.cancel(); reject(new Error("DNS lookup timed out")); }, timeoutMs); }),
    ]);
    const hasMx = mxRecords.some((record) => record.exchange && record.exchange !== ".");
    return NextResponse.json({ success: true, email, domain, validSyntax: true, hasMxRecords: hasMx, mxRecords,
      status: hasMx ? "Mail routing records found; mailbox deliverability is unverified" : "Domain has no usable MX records" });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENODATA" || code === "ENOTFOUND") return NextResponse.json({ success: true, email, domain, validSyntax: true, hasMxRecords: false, mxRecords: [], status: "Domain has no MX records; mailbox deliverability is unverified" });
    return NextResponse.json({ success: false, error: "Mail routing lookup unavailable or timed out" }, { status: 502 });
  } finally { clearTimeout(timer); resolver?.cancel(); }
}
