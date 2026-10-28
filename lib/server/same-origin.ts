/** Match the browser-visible Host; Next may normalize request.url to its bind host. */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    if (source.origin !== origin || !["http:", "https:"].includes(source.protocol)) return false;
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured && source.origin === new URL(configured).origin) return true;
    const target = new URL(request.url);
    const host = request.headers.get("host") || target.host;
    return source.origin === `${target.protocol}//${host}`;
  } catch { return false; }
}
