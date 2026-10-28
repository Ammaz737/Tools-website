export function siteOrigin(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  if (!value?.trim()) return "http://localhost:3000";
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without credentials, path, query or fragment");
  }
  return url.origin;
}
