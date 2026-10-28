import { requireToolAccess } from "@/lib/server/tool-access";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import tls from "tls";
import { isIP } from "node:net";
import { isSafeTarget, resolveSafeTarget } from "@/lib/server/ssrf";
import { getCached, setCached } from "@/lib/server/cache";

export const runtime = "nodejs";

let activeInspections = 0;

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "network:ssl-checker", 30);
  if (limited) return limited;
  const access = await requireToolAccess("ssl-checker", { inputChars: new URL(req.url).searchParams.get("domain")?.length ?? 0 });
  if ("response" in access) return access.response;
  const timeoutMs = Math.min(access.status.timeoutMs ?? 5000, 30000);
  if (activeInspections >= 24) return NextResponse.json({ success: false, error: "SSL inspection capacity exceeded" }, { status: 429 });
  activeInspections++;
  try { return await inspectCertificate(req, timeoutMs); } finally { activeInspections--; }
}

async function inspectCertificate(req: NextRequest, timeoutMs: number) {
  const started = Date.now();
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("domain") || "";

  const check = isSafeTarget(target);
  if (!check.safe || !check.domain) {
    return NextResponse.json({ success: false, error: check.reason || "Invalid domain target" }, { status: 400 });
  }

  let approved;
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    approved = await Promise.race([resolveSafeTarget(target), new Promise<never>((_, reject) => {
      dnsTimer = setTimeout(() => reject(new Error("DNS resolution timed out")), timeoutMs);
      dnsTimer.unref();
    })]);
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Invalid target" }, { status: 400 });
  }
  finally { clearTimeout(dnsTimer); }
  const domain = approved.domain;
  const cacheKey = `ssl_${domain}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return NextResponse.json({ success: true, domain, certificate: cached, cached: true });
  }

  return new Promise<NextResponse>((resolve) => {
    const remainingMs = Math.max(1, timeoutMs - (Date.now() - started));
    const deadline = setTimeout(() => {
      socket.destroy();
      resolve(NextResponse.json({ success: false, error: "SSL connection timed out" }, { status: 504 }));
    }, remainingMs);
    const socket = tls.connect(
      {
        host: approved.address.address,
        port: 443,
        servername: isIP(domain) ? undefined : domain,
        // Inspect invalid certificates too; report validity from chain and hostname checks.
        rejectUnauthorized: false,
        checkServerIdentity: (_hostname, certificate) => tls.checkServerIdentity(domain, certificate),
        timeout: remainingMs,
      },
      () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();

        if (!cert || Object.keys(cert).length === 0) {
          resolve(
            NextResponse.json({ success: false, error: "No SSL certificate found on port 443" }, { status: 404 })
          );
          return;
        }

        const validFrom = cert.valid_from;
        const validTo = cert.valid_to;
        const expiryDate = new Date(validTo);
        const daysRemaining = Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

        const certData = {
          domain,
          subject: cert.subject?.CN || domain,
          issuer: cert.issuer?.O || cert.issuer?.CN || "Unknown Issuer",
          validFrom,
          validTo,
          daysRemaining,
          valid: socket.authorized && !tls.checkServerIdentity(domain, cert) && Date.parse(validFrom) <= Date.now() && Date.parse(validTo) > Date.now(),
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber,
        };

        setCached(cacheKey, certData, 900);
        resolve(NextResponse.json({ success: true, domain, certificate: certData, cached: false }));
      }
    );

    socket.once("close", () => clearTimeout(deadline));
    socket.on("error", (err) => {
      socket.destroy();
      resolve(
        NextResponse.json(
          { success: false, error: err.message || "Failed to establish SSL connection" },
          { status: 500 }
        )
      );
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(NextResponse.json({ success: false, error: "SSL connection timed out" }, { status: 504 }));
    });
  });
}
