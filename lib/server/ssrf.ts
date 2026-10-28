import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export type Address = { address: string; family: number };
export type Resolver = (hostname: string) => Promise<Address[]>;
const defaultResolver: Resolver = (hostname) => lookup(hostname, { all: true, verbatim: true });

/** Allow globally routable IPv4 and ordinary global-unicast IPv6 only. */
export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (family !== 6) return false;
  // URL canonicalization expands embedded IPv4 and normalizes compressed forms.
  const canonical = new URL(`http://[${address}]/`).hostname.slice(1, -1);
  const first = parseInt(canonical.split(":")[0], 16);
  if (!Number.isFinite(first) || first < 0x2000 || first > 0x3fff) return false;
  // IETF special-purpose, documentation, 6to4 and deprecated 6bone blocks.
  return !/^2001:(?:[0-1]?[0-9a-f]{0,2}|db8)(?::|$)/i.test(canonical) &&
    !/^2002:/i.test(canonical) && !/^3ffe:/i.test(canonical) && !/^3fff:/i.test(canonical);
}

export function isSafeTarget(input: string): { safe: boolean; reason?: string; url?: URL; domain?: string } {
  try {
    if (typeof input !== "string" || !input.trim()) throw new Error("Invalid target input");
    const cleaned = input.trim();
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS targets are supported");
    if (url.username || url.password) throw new Error("URL credentials are not allowed");
    if (url.port && url.port !== "80" && url.port !== "443") throw new Error("Only ports 80 and 443 are allowed");
    const domain = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
    if (!domain || domain === "localhost" || /\.(localhost|local|internal|lan|home|test|invalid)$/.test(domain)) throw new Error("Target is a private or local domain");
    if (isIP(domain) && !isPublicAddress(domain)) throw new Error("Target IP address is in a private or restricted network range");
    return { safe: true, url, domain };
  } catch (error) {
    return { safe: false, reason: error instanceof Error ? error.message : "Invalid target" };
  }
}

export async function resolveSafeTarget(input: string, resolver: Resolver = defaultResolver) {
  const check = isSafeTarget(input);
  if (!check.safe || !check.url || !check.domain) throw new Error(check.reason || "Invalid target");
  const addresses = isIP(check.domain) ? [{ address: check.domain, family: isIP(check.domain) }] : await resolver(check.domain);
  if (!addresses.length || addresses.some((item) => !isPublicAddress(item.address) || isIP(item.address) !== item.family)) {
    throw new Error("Target DNS resolves to a private or restricted network range");
  }
  return { url: check.url, domain: check.domain, address: addresses[0] };
}

export function extractDomain(input: string): string {
  const result = isSafeTarget(input);
  return result.safe && result.domain ? result.domain : "";
}
