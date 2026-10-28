import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";
import { isPublicAddress } from "./ssrf";

/** Explicit server configuration only; absent configuration uses system DNS. */
export function createNetworkResolver(timeoutMs: number): Resolver {
  const resolver = new Resolver({ timeout: timeoutMs, tries: 1 });
  const configured = process.env.DNS_RESOLVER_SERVERS?.trim();
  if (configured) {
    const servers = configured.split(",").map(value => value.trim());
    if (servers.length > 4 || servers.some(server => !isIP(server) || !isPublicAddress(server))) {
      throw new Error("DNS resolver configuration is invalid");
    }
    resolver.setServers(servers);
  }
  return resolver;
}
