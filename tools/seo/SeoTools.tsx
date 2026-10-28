"use client";

import { useState } from "react";
import { Button, Input, Textarea, Select, ResultPanel } from "@/components/ui";

type Kind = "meta" | "robots" | "sitemap" | "density" | "serp" | "og" | "canonical" | "schema";
const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
function webUrl(value: string): string {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error("Enter a complete HTTP or HTTPS URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Use an HTTP or HTTPS URL without credentials.");
  return url.href;
}
function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const initial = { title: "", description: "", url: "", image: "", text: "", keyword: "", agent: "*", allow: "", disallow: "/admin/", schema: "Article", author: "", price: "", currency: "USD" };

function SeoWorkspace({ kind }: { kind: Kind }) {
  const [values, setValues] = useState(initial);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ title: string; description: string; url: string } | null>(null);
  const reset = () => { setValues(initial); setResult(""); setError(""); setPreview(null); };
  const field = (key: keyof typeof initial, label: string, multiline = false, hint?: string) => multiline
    ? <Textarea key={key} label={label} value={values[key]} maxLength={kind === "density" ? 100000 : 20000} rows={5} placeholder={hint} onChange={(event) => { setValues({ ...values, [key]: event.target.value }); setResult(""); setPreview(null); }} />
    : <Input key={key} label={label} value={values[key]} maxLength={2000} helperText={hint} onChange={(event) => { setValues({ ...values, [key]: event.target.value }); setResult(""); setPreview(null); }} />;
  const generate = () => {
    setError(""); setResult(""); setPreview(null);
    try {
      let output = "";
      if (["meta", "og", "serp", "schema"].includes(kind) && !values.title.trim()) throw new Error("Enter a title or name.");
      if (kind === "meta") {
        output = `<title>${escape(values.title)}</title>\n<meta name="description" content="${escape(values.description)}">`;
        if (values.url.trim()) output += `\n<link rel="canonical" href="${escape(webUrl(values.url))}">`;
      } else if (kind === "canonical") {
        const url = new URL(webUrl(values.url)); url.hash = "";
        output = `<link rel="canonical" href="${escape(url.href)}">`;
      } else if (kind === "og") {
        output = [["og:type", "website"], ["og:title", values.title], ["og:description", values.description], ["og:url", webUrl(values.url)], ...(values.image.trim() ? [["og:image", webUrl(values.image)]] : [])].map(([property, content]) => `<meta property="${property}" content="${escape(content)}">`).join("\n");
      } else if (kind === "serp") {
        const url = webUrl(values.url);
        setPreview({ title: values.title, description: values.description, url });
        output = `Title (${values.title.length} characters): ${values.title}\nURL: ${url}\nDescription (${values.description.length} characters): ${values.description}`;
      } else if (kind === "robots") {
        if (!/^[a-zA-Z0-9*_.-]+$/.test(values.agent.trim())) throw new Error("Use one valid user-agent token without spaces or newlines.");
        const directives = (text: string, directive: string) => text.split(/\r?\n/).map((path) => path.trim()).filter(Boolean).map((path) => {
          if (!path.startsWith("/") || /[\r\n#]/.test(path)) throw new Error("Each crawl rule must be a path starting with / and contain no # comments.");
          return `${directive}: ${path}`;
        });
        output = [`User-agent: ${values.agent.trim()}`, ...directives(values.allow, "Allow"), ...directives(values.disallow, "Disallow"), ...(values.url.trim() ? [`Sitemap: ${webUrl(values.url)}`] : [])].join("\n");
      } else if (kind === "sitemap") {
        const lines = values.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        if (!lines.length) throw new Error("Enter at least one page URL.");
        if (lines.length > 500) throw new Error("Generate up to 500 URLs at a time.");
        const urls = [...new Set(lines.map(webUrl))];
        if (new Set(urls.map((url) => new URL(url).origin)).size !== 1) throw new Error("Sitemap URLs must belong to the same site origin.");
        output = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escape(url)}</loc></url>`).join("\n")}\n</urlset>`;
      } else if (kind === "density") {
        const words = values.text.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];
        if (!words.length) throw new Error("Enter text containing words.");
        const counts = new Map<string, number>(); words.forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
        output = `Total words: ${words.length}\n\nKeyword\tOccurrences\tDensity\n` + [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 50).map(([word, count]) => `${word}\t${count}\t${(count / words.length * 100).toFixed(2)}%`).join("\n");
        if (values.keyword.trim()) {
          const phrase = values.keyword.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];
          if (!phrase.length) throw new Error("Enter a keyword containing words.");
          let matches = 0;
          for (let i = 0; i <= words.length - phrase.length; i++) if (phrase.every((word, j) => words[i + j] === word)) matches++;
          output += `\n\nTarget phrase: ${values.keyword}\nOccurrences: ${matches}\nDensity (occurrences / total words): ${(matches / words.length * 100).toFixed(2)}%`;
        }
      } else if (kind === "schema") {
        const data: Record<string, unknown> = { "@context": "https://schema.org", "@type": values.schema, name: values.title, description: values.description, url: webUrl(values.url) };
        if (values.schema === "Article") { data.headline = values.title; if (values.author.trim()) data.author = { "@type": "Person", name: values.author }; }
        if (values.image.trim()) data.image = webUrl(values.image);
        if (values.schema === "Product" && values.price.trim()) {
          const price = Number(values.price);
          if (!Number.isFinite(price) || price < 0 || !/^[A-Z]{3}$/.test(values.currency)) throw new Error("Enter a nonnegative price and a three-letter uppercase currency code.");
          data.offers = { "@type": "Offer", price, priceCurrency: values.currency, url: data.url };
        }
        output = JSON.stringify(data, null, 2).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
      }
      setResult(output);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Check your input."); }
  };
  const filename = kind === "sitemap" ? "sitemap.xml" : kind === "robots" ? "robots.txt" : kind === "schema" ? "schema.json" : `${kind}-output.txt`;
  return <div className="space-y-5">
    {["meta", "og", "serp", "schema"].includes(kind) && <>{field("title", kind === "schema" ? "Name or headline" : "Page title")}{field("description", "Description", true)}</>}
    {["meta", "og", "serp", "canonical", "schema", "robots"].includes(kind) && field("url", kind === "robots" ? "Sitemap URL (optional)" : "Page URL", false, "https://example.com/page")}
    {["og", "schema"].includes(kind) && field("image", "Image URL (optional)")}
    {kind === "robots" && <>{field("agent", "User agent")}{field("allow", "Allow paths (one per line)", true)}{field("disallow", "Disallow paths (one per line)", true)}<p className="text-sm text-[var(--ink-soft)]">Crawl rules are public instructions, not access controls. Protect private pages with authentication.</p></>}
    {kind === "sitemap" && field("text", "Page URLs (one per line)", true, "https://example.com/\nhttps://example.com/about")}
    {kind === "density" && <>{field("text", "Article text", true)}{field("keyword", "Target keyword or phrase (optional)")}</>}
    {kind === "schema" && <><Select label="Schema type" value={values.schema} options={["Article", "Organization", "Product"].map((value) => ({ value, label: value }))} onChange={(event) => { setValues({ ...values, schema: event.target.value }); setResult(""); }} />{values.schema === "Article" && field("author", "Author (optional)")}{values.schema === "Product" && <>{field("price", "Price (optional)")}{field("currency", "Currency")}</>}<p className="text-sm text-[var(--ink-soft)]">Use this JSON as a JSON-LD script payload. Include only facts shown on your page; validate against your search engine’s rich result requirements.</p></>}
    <div className="flex gap-2"><Button onClick={generate}>{kind === "density" ? "Analyze text" : kind === "serp" ? "Preview result" : "Generate"}</Button><Button variant="secondary" onClick={reset}>Reset inputs</Button></div>
    {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
    {preview && <div data-testid="serp-preview" className="rounded-xl border border-[var(--line)] p-5 break-words"><p className="text-sm">{preview.url}</p><p className="text-xl text-blue-600">{preview.title}</p><p>{preview.description}</p><p className="mt-3 text-xs text-[var(--ink-soft)]">Approximate preview. Search engines may rewrite titles and descriptions; layout varies by device and query.</p></div>}
    {result && <ResultPanel title="Generated output" status="done" copyValue={result} onDownload={() => download(result, filename)} onClear={() => { setResult(""); setPreview(null); }}><pre data-testid="seo-output" className="whitespace-pre-wrap break-words text-sm font-mono">{result}</pre></ResultPanel>}
  </div>;
}
export const MetaTagGeneratorTool = () => <SeoWorkspace kind="meta" />;
export const RobotsTxtGeneratorTool = () => <SeoWorkspace kind="robots" />;
export const SitemapGeneratorTool = () => <SeoWorkspace kind="sitemap" />;
export const KeywordDensityCheckerTool = () => <SeoWorkspace kind="density" />;
export const SerpPreviewTool = () => <SeoWorkspace kind="serp" />;
export const OpenGraphGeneratorTool = () => <SeoWorkspace kind="og" />;
export const CanonicalTagGeneratorTool = () => <SeoWorkspace kind="canonical" />;
export const SchemaMarkupGeneratorTool = () => <SeoWorkspace kind="schema" />;
export const seoToolComponents = { "meta-tag-generator": MetaTagGeneratorTool, "robots-txt-generator": RobotsTxtGeneratorTool, "sitemap-generator": SitemapGeneratorTool, "keyword-density-checker": KeywordDensityCheckerTool, "serp-preview-tool": SerpPreviewTool, "open-graph-generator": OpenGraphGeneratorTool, "canonical-tag-generator": CanonicalTagGeneratorTool, "schema-markup-generator": SchemaMarkupGeneratorTool };
