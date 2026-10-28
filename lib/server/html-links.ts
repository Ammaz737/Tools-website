import { parse } from "parse5";
import type { DefaultTreeAdapterMap } from "parse5";
import { isSafeTarget } from "./ssrf";

type Node = DefaultTreeAdapterMap["node"];
/** Parse inert HTML; every returned URL still requires DNS validation before fetch. */
export function extractPublicHtmlLinks(html: string, responseUrl: string, limit = 20): string[] {
  const document = parse(html, { scriptingEnabled: false });
  const elements: DefaultTreeAdapterMap["element"][] = [];
  const stack: Node[] = [document];
  let visited = 0;
  while (stack.length && visited++ < 100000) {
    const node = stack.pop()!;
    if ("tagName" in node) elements.push(node);
    // Template contents are inert and are not traversed.
    if ("childNodes" in node) for (let i = node.childNodes.length - 1; i >= 0; i--) stack.push(node.childNodes[i]);
  }
  let base = responseUrl;
  const firstBase = elements.find(node => node.tagName === "base" && node.attrs.some(a => a.name === "href"));
  if (firstBase) {
    try { base = new URL(firstBase.attrs.find(a => a.name === "href")!.value, responseUrl).href; } catch { /* Invalid base uses document URL. */ }
  }
  const urls = new Set<string>();
  const maximum = Math.max(0, Math.min(20, Math.floor(limit)));
  if (!maximum) return [];
  for (const node of elements) {
    if (!["a", "area", "link"].includes(node.tagName)) continue;
    const href = node.attrs.find(a => a.name === "href")?.value.trim();
    if (!href || href.startsWith("#")) continue;
    try {
      const url = new URL(href, base);
      url.hash = "";
      if (isSafeTarget(url.href).safe) urls.add(url.href);
      if (urls.size >= maximum) break;
    } catch { /* Malformed or unsupported URL is excluded. */ }
  }
  return [...urls];
}
