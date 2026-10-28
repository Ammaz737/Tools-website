"use client";

import { useRef, useState } from "react";
import { Button, ResultPanel, Textarea } from "@/components/ui";

type Operation = "xml-formatter" | "xml-validator" | "html-formatter" | "html-minifier" | "css-minifier" | "javascript-minifier" | "sql-formatter";

async function transform(input: string, operation: Operation): Promise<string> {
  if (!input.trim()) throw new Error("Enter source text first.");
  if (input.length > 100_000) throw new Error("Source text exceeds the 100,000 character limit.");
  if (operation.startsWith("xml")) {
    if (/<!DOCTYPE|<!ENTITY/i.test(input)) throw new Error("DTD and entity declarations are not supported.");
    const document = new DOMParser().parseFromString(input, "application/xml");
    if (document.querySelector("parsererror")) throw new Error("Invalid XML syntax.");
    if (operation === "xml-validator") return "Valid XML syntax.";
    const serializer = new XMLSerializer();
    // Preserve mixed content, CDATA and whitespace-sensitive text verbatim.
    const render = (node: Node, depth: number): string => {
      if (depth > 100) throw new Error("XML nesting exceeds 100 levels.");
      if (node.nodeType !== Node.ELEMENT_NODE) return serializer.serializeToString(node);
      const element = node as Element;
      const children = Array.from(element.childNodes);
      if (children.some((child) => child.nodeType === Node.CDATA_SECTION_NODE || child.nodeType === Node.TEXT_NODE)) return serializer.serializeToString(node);
      if (!children.length) return serializer.serializeToString(node);
      const shell = serializer.serializeToString(element.cloneNode(false));
      const opening = shell.replace(/\s*\/>$/, ">");
      return `${opening}\n${children.map((child) => "  ".repeat(depth + 1) + render(child, depth + 1)).join("\n")}\n${"  ".repeat(depth)}</${element.tagName}>`;
    };
    return Array.from(document.childNodes).map((node) => render(node, 0)).join("\n");
  }
  if (operation === "html-formatter") {
    const [prettier, html] = await Promise.all([import("prettier/standalone"), import("prettier/plugins/html")]);
    return prettier.format(input, { parser: "html", plugins: [html], htmlWhitespaceSensitivity: "strict" });
  }
  if (operation === "html-minifier") {
    // Preserve all text whitespace and embedded code; only remove comments and
    // normalize tag syntax. Aggressive whitespace collapse changes HTML meaning.
    const document = new DOMParser().parseFromString(input, "text/html");
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
    const comments: Node[] = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    for (const comment of comments) comment.parentNode?.removeChild(comment);
    return (document.doctype ? "<!DOCTYPE html>" : "") + document.documentElement.outerHTML;
  }
  if (operation === "css-minifier") {
    const css = await import("css-tree");
    return css.generate(css.parse(input, { onParseError: (error) => { throw error; } }));
  }
  if (operation === "javascript-minifier") {
    const { minify } = await import("terser");
    // No evaluation, identifier mangling or semantic compression of user code.
    const result = await minify(input, { compress: false, mangle: false, format: { comments: false } });
    return result.code ?? "";
  }
  const { format } = await import("sql-formatter");
  return format(input, { language: "sql", keywordCase: "upper" });
}

export function AdditionalDeveloperTool({ operation }: { operation: Operation }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const clear = () => { generation.current++; setInput(""); setOutput(""); setError(""); setBusy(false); };
  const run = async () => {
    const current = ++generation.current;
    setOutput(""); setError(""); setBusy(true);
    try { const result = await transform(input, operation); if (current === generation.current) setOutput(result); }
    catch (error) { if (current === generation.current) setError(error instanceof Error ? error.message : "Unable to process source."); }
    finally { if (current === generation.current) setBusy(false); }
  };
  return <div className="space-y-4">
    <Textarea label="Source text" rows={10} maxLength={100001} value={input} onChange={(event) => { generation.current++; setBusy(false); setInput(event.target.value); setOutput(""); setError(""); }} />
    {operation === "html-minifier" && <p className="text-sm">Conservative mode removes comments and normalizes tags while preserving text whitespace and embedded code. Output is a complete HTML document.</p>}
    <div className="flex gap-3"><Button onClick={() => void run()} disabled={busy}>{busy ? "Processing…" : "Process"}</Button><Button onClick={clear}>Clear</Button></div>
    {error && <p role="alert">{error}</p>}
    <ResultPanel title="Result" copyValue={output} status={error ? "error" : "live"}><pre className="whitespace-pre-wrap break-all" data-testid="developer-result">{output}</pre></ResultPanel>
  </div>;
}
