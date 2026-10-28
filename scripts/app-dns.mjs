// Optional application-process DNS override. Never changes operating-system settings.
// Preload before Next starts so its dev child processes inherit the same resolver.
import dns from 'node:dns';
import { isIP } from 'node:net';

const configured = process.env.APP_DNS_SERVERS?.trim();
if (configured) {
  const servers = configured.split(',').map(value => value.trim());
  if (servers.length > 3 || servers.some(value => !isIP(value))) {
    throw new Error('APP_DNS_SERVERS must contain one to three comma-separated DNS server IP addresses');
  }
  dns.setServers(servers);
}
