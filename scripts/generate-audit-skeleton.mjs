import { readFileSync, writeFileSync } from "fs";

// Parse tools.ts with a lightweight regex (avoid TS loader issues on Windows)
const toolsSrc = readFileSync(new URL("../lib/tools.ts", import.meta.url), "utf8");
const idxSrc = readFileSync(new URL("../tools/index.tsx", import.meta.url), "utf8");

const toolRe =
  /t\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"(client|server)"\s*,\s*"([^"]*)"/g;

const tools = [];
let m;
while ((m = toolRe.exec(toolsSrc))) {
  tools.push({
    id: m[1],
    name: m[2],
    category: m[3],
    runtime: m[4],
    blurb: m[5],
  });
}

const wired = new Set();
for (const match of idxSrc.matchAll(/case\s+"([^"]+)"/g)) {
  wired.add(match[1]);
}

const knownDegraded = new Set([
  "heic-to-jpg",
  "background-remover",
  "image-upscaler",
  "powerpoint-to-pdf",
  "pdf-to-excel",
  "pdf-to-powerpoint",
  "compress-pdf",
  "plagiarism-checker",
  "spell-checker",
]);

const categories = [
  "pdf",
  "image",
  "ai",
  "text",
  "developer",
  "seo",
  "security",
  "converters",
  "calculators",
  "utilities",
];

function maturity(tool) {
  if (!wired.has(tool.id)) return "placeholder";
  if (knownDegraded.has(tool.id)) return "degraded";
  return "full";
}

const lines = [];
lines.push("# Audit Results — Quiet Workshop Tools");
lines.push("");
lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
lines.push(`Total tools: **${tools.length}**`);
lines.push(`Wired in dispatcher: **${[...wired].filter((id) => tools.some((t) => t.id === id)).length}**`);
lines.push("");
lines.push("## Summary by category");
lines.push("");
lines.push("| Category | Total | Full | Degraded | Placeholder |");
lines.push("|----------|------:|-----:|---------:|------------:|");

for (const cat of categories) {
  const list = tools.filter((t) => t.category === cat);
  const mats = list.map(maturity);
  lines.push(
    `| ${cat} | ${list.length} | ${mats.filter((x) => x === "full").length} | ${mats.filter((x) => x === "degraded").length} | ${mats.filter((x) => x === "placeholder").length} |`,
  );
}

const allMats = tools.map(maturity);
lines.push(
  `| **ALL** | **${tools.length}** | **${allMats.filter((x) => x === "full").length}** | **${allMats.filter((x) => x === "degraded").length}** | **${allMats.filter((x) => x === "placeholder").length}** |`,
);
lines.push("");
lines.push("## Shared components map");
lines.push("");
lines.push("| Component | Tool IDs |");
lines.push("|-----------|----------|");
lines.push("| `OfficeConverterTool` | pdf-to-word, word-to-pdf, pdf-to-excel, excel-to-pdf, pdf-to-powerpoint, powerpoint-to-pdf |");
lines.push("| `PdfToImageTool` | pdf-to-jpg, pdf-to-png |");
lines.push("| `ImageToPdfTool` | jpg-to-pdf, png-to-pdf, image-to-pdf |");
lines.push("| `ImageConverterTool` | convert-image, jpg-to-png, png-to-jpg, webp-*, jfif-to-png, jpeg-to-jpg, heic-to-jpg |");
lines.push("| `AiWriterTool` | ai-writer, ai-email-writer, ai-summarizer, paraphrasing-tool, article-rewriter, ai-humanizer |");
lines.push("| `AiGrammarTranslatorTool` | grammar-checker, spell-checker, ai-translator |");
lines.push("| `HashGeneratorTool` | hash-generator, md5-generator, sha256-generator |");
lines.push("| `EmiCalculatorTool` | emi-calculator, loan-calculator |");
lines.push("| `GstCalculatorTool` | gst-calculator, vat-calculator |");
lines.push("| `PasswordGeneratorTool` | password-generator, random-password-generator |");
lines.push("| `ColorPickerTool` | color-picker, color-converter |");
lines.push("| `UuidGeneratorTool` | uuid-generator, uuid-generator-util |");
lines.push("");
lines.push("## P0 / P1 backlog (seed + deep audit)");
lines.push("");
lines.push("| Sev | Tool | Issue | Fix type | Status |");
lines.push("|-----|------|-------|----------|--------|");
lines.push("| P0 | word-to-pdf / pdf-to-word | Formatting clip/shift risk; need harden + fidelity UI | harden | open |");
lines.push("| P0 | powerpoint-to-pdf | Text-only slides, not visual | label + harden | open |");
lines.push("| P0 | heic-to-jpg | No heic2any; Chrome fails | label / lib-install | open |");
lines.push("| P0 | background-remover | Chroma only, not AI | label | open |");
lines.push("| P0 | image-upscaler | Canvas scale, not AI | label | open |");
lines.push("| P1 | compress-pdf | Image re-encode destroys selectable text | label / harden | open |");
lines.push("| P1 | plagiarism-checker | LLM ≠ real plagiarism index | label | open |");
lines.push("| P1 | spell-checker | Shares grammar API; registry says client | label / bugfix | open |");
lines.push("| P1 | All /api/* | No rate limiting | server | open |");
lines.push("| P2 | ~33 placeholders | Not wired | implement | open |");
lines.push("");

for (const cat of categories) {
  lines.push(`## ${cat}`);
  lines.push("");
  lines.push(
    "| ID | Name | Runtime | Wired | Maturity | Code | Issues | Fix | Audit |",
  );
  lines.push(
    "|----|------|---------|:-----:|----------|------|--------|-----|-------|",
  );
  for (const tool of tools.filter((t) => t.category === cat)) {
    const isWired = wired.has(tool.id);
    const mat = maturity(tool);
    const code = isWired ? "dispatcher" : "ToolPlaceholder";
    let issues = "—";
    let fix = "—";
    if (!isWired) {
      issues = "Not implemented";
      fix = "implement";
    } else if (mat === "degraded") {
      issues = "See P0/P1 backlog";
      fix = "label / harden / lib-install";
    }
    lines.push(
      `| \`${tool.id}\` | ${tool.name} | ${tool.runtime} | ${isWired ? "yes" : "no"} | ${mat} | ${code} | ${issues} | ${fix} | done |`,
    );
  }
  lines.push("");
}

lines.push("## Deep notes (A1–A3)");
lines.push("");
lines.push("See sections below filled during live code audit.");
lines.push("");

writeFileSync(new URL("../AUDIT-RESULTS.md", import.meta.url), lines.join("\n"), "utf8");
console.log("Wrote AUDIT-RESULTS.md", tools.length, "tools");
console.log(
  "placeholder",
  tools.filter((t) => !wired.has(t.id)).map((t) => t.id).join(","),
);
