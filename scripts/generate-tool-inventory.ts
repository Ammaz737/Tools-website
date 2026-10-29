import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { tools } from "../lib/tools";

const root = path.resolve(import.meta.dirname, "..");
const relative = (file: string) => path.relative(root, file).replaceAll("\\", "/");
const read = (file: string) => readFileSync(path.resolve(root, file), "utf8");
const parse = (file: string) => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const dispatcher = parse("tools/index.tsx");
const imports = new Map<string, string>();
for (const node of dispatcher.statements) {
  if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
  const bindings = node.importClause?.namedBindings;
  if (bindings && ts.isNamedImports(bindings)) {
    for (const binding of bindings.elements) imports.set(binding.name.text, node.moduleSpecifier.text);
  }
}

function resolveLocal(from: string, specifier: string): string | undefined {
  const base = specifier.startsWith("@/") ? path.resolve(root, specifier.slice(2))
    : specifier.startsWith(".") ? path.resolve(root, path.dirname(from), specifier) : undefined;
  if (!base) return;
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
    .find((file) => existsSync(file) && /\.(ts|tsx)$/.test(file));
}

function findComponent(node: ts.Node): string | undefined {
  if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) return node.tagName.getText(dispatcher);
  let found: string | undefined;
  ts.forEachChild(node, (child) => { found ??= findComponent(child); });
  return found;
}

const wiring = new Map<string, string>();
function inspect(node: ts.Node) {
  if (ts.isSwitchStatement(node) && node.expression.getText(dispatcher) === "tool.id") {
    const pending: string[] = [];
    for (const clause of node.caseBlock.clauses) {
      if (ts.isCaseClause(clause) && ts.isStringLiteral(clause.expression)) pending.push(clause.expression.text);
      const component = clause.statements.map(findComponent).find(Boolean);
      if (component) {
        for (const id of pending) wiring.set(id, component);
        pending.length = 0;
      }
    }
  }
  ts.forEachChild(node, inspect);
}
inspect(dispatcher);

// Source-graph package dependencies are intentionally conservative: shared files
// contain several tools, so this is not a claim that every package runs per tool.
function sourceGraph(entry: string) {
  const files = new Set<string>();
  const packages = new Set<string>();
  function visit(file: string) {
    if (files.has(file)) return;
    files.add(file);
    const source = parse(file);
    function inspectImport(node: ts.Node) {
      let specifier: string | undefined;
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) specifier = node.moduleSpecifier.text;
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) specifier = node.arguments[0].text;
      if (specifier) {
        const local = resolveLocal(file, specifier);
        if (local) visit(relative(local));
        else if (!specifier.startsWith(".") && !specifier.startsWith("@/") && !specifier.startsWith("node:")) packages.add(specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]);
      }
      ts.forEachChild(node, inspectImport);
    }
    inspectImport(source);
  }
  visit(entry);
  return { files: [...files].sort(), packages: [...packages].sort() };
}

const apiByComponent: Record<string, string> = {
  CurrencyConverterServerTool: "/api/rates", DnsLookupTool: "/api/dns", WhoisLookupTool: "/api/whois",
  SslCheckerTool: "/api/ssl", IpLookupTool: "/api/ip", EmailValidatorTool: "/api/email-check",
  BrokenLinkCheckerTool: "/api/crawl?mode=links", WebsiteSpeedTestTool: "/api/crawl",
  AiWriterTool: "/api/ai", AiGrammarTranslatorTool: "/api/ai", AiDetectorTool: "/api/ai", PlagiarismCheckerTool: "/api/plagiarism",
};
const integrations: Record<string, string[]> = {
  "/api/rates": ["Exchange-rate provider network access"], "/api/dns": ["DNS resolver network access"],
  "/api/whois": ["Public RDAP network access"], "/api/ssl": ["Outbound TLS network access"],
  "/api/ip": ["ipapi.co network access"], "/api/email-check": ["DNS resolver network access"],
  "/api/crawl": ["Public website network access"], "/api/crawl?mode=links": ["Public website network access"],
  "/api/ai": ["Configured OpenAI/Gemini credentials or Ollama endpoint and model; live provider unverified"],
};
const knownLimitations: Record<string, string> = {
  "heic-to-jpg": "Primary HEIC image decoded locally in a bounded worker; auxiliary images, animation and metadata are not exported.",
  "background-remover": "Chroma removal, not general AI background segmentation.",
  "image-upscaler": "Canvas resizing, not AI detail reconstruction.",
  "powerpoint-to-pdf": "Mixed text/image and multiple-image slides are rejected to prevent observed content loss; browser fallback does not render general slide layout. Optional private native Office engine requires live acceptance.",
  "pdf-to-word": "Page-image mode is not editable; horizontal text and detected tables reconstructed in editable mode, with original graphics/styles/complex layouts unsupported.",
  "pdf-to-excel": "Horizontal aligned tables reconstructed as text cells; formulas, source graphics/styles and arbitrary complex layouts unsupported.",
  "pdf-to-powerpoint": "Raster page images; output is not editable slide content.",
  "compress-pdf": "Default mode preserves text, links and page geometry while optimizing eligible embedded JPEGs. Optional Flatten pages removes selectable text/links. Other image encodings are retained and may not shrink; output is never larger than input.",
  "plagiarism-checker": "Dedicated Copyleaks integration requires credentials, authenticated HTTPS webhook, Atlas and live acceptance; sandbox scores are not real checks.",
};
const matrixPath = path.resolve(root, "docs/tool-test-matrix.json");
type Previous = { sourceFingerprint?: string; status?: string; statusReason?: string; knownErrors?: string[]; verification?: unknown };
const previous = existsSync(matrixPath) ? JSON.parse(readFileSync(matrixPath, "utf8")) as { tools?: Array<Previous & { id: string }> } : {};
const previousById = new Map((previous.tools ?? []).map((tool) => [tool.id, tool]));
const graphCache = new Map<string, ReturnType<typeof sourceGraph>>();
const rows = tools.map((tool) => {
  const component = wiring.get(tool.id) ?? "ToolPlaceholder";
  const source = relative(resolveLocal("tools/index.tsx", imports.get(component)!)!);
  if (!graphCache.has(source)) graphCache.set(source, sourceGraph(source));
  const graph = graphCache.get(source)!;
  const sourceFingerprint = createHash("sha256");
  for (const file of ["lib/tools.ts", "tools/index.tsx", "package-lock.json", "app/tools/[slug]/page.tsx", "lib/public-tools.ts", "lib/tool-status.ts", "lib/seo.ts", "lib/jsonld.ts", "lib/tool-capabilities.ts", "lib/site-config.ts", "lib/pdf-tool-content.ts"]) {
    sourceFingerprint.update(file).update(read(file));
  }
  const api = apiByComponent[component] ?? null;
  if (api) {
    const apiPath = `app${api.split("?")[0]}/route.ts`;
    for (const file of sourceGraph(apiPath).files) sourceFingerprint.update(file).update(read(file));
  }
  if (component === "PlagiarismCheckerTool") for (const entry of ["app/api/plagiarism/[jobId]/route.ts", "app/api/plagiarism/webhook/[jobId]/[status]/route.ts"]) {
    for (const file of sourceGraph(entry).files) sourceFingerprint.update(file).update(read(file));
  }
  if (component === "OfficeConverterTool") for (const file of sourceGraph("app/api/convert-office/route.ts").files) sourceFingerprint.update(file).update(read(file));
  for (const file of graph.files) sourceFingerprint.update(file).update(read(file));
  const runtimeEvidence: string[] = [];
  if (graph.files.includes("lib/heic-client.ts")) runtimeEvidence.push("public/codecs/heic/manifest.json", "public/codecs/heic/decode-worker.js", "scripts/prepare-heic-assets.mjs");
  if (graph.files.includes("lib/pdf-ocr.ts")) runtimeEvidence.push("public/ocr/manifest.json", "public/ocr/worker-entry.js", "scripts/prepare-ocr-assets.mjs");
  for (const file of runtimeEvidence) sourceFingerprint.update(file).update(read(file));

  const fingerprint = sourceFingerprint.digest("hex");
  const wired = wiring.has(tool.id);
  const prior = previousById.get(tool.id);
  const retained = wired && prior?.sourceFingerprint === fingerprint && prior.verification;
  const missingCapability = false;
  return {
    id: tool.id, name: tool.name, category: tool.category, publicUrl: `/tools/${tool.id}`,
    wired, component, implementationFile: source, associatedApiEndpoint: api,
    registryRuntime: tool.runtime,
    processingStrategy: wired ? tool.runtime === "client" ? "CLIENT" : tool.category === "ai" ? "EXTERNAL_API" : "SERVER" : "UNIMPLEMENTED",
    dependencies: graph.packages, dependencyScope: "Conservative shared-module source graph", sourceFiles: [...graph.files, ...runtimeEvidence],
    externalRequirements: tool.id === "plagiarism-checker" ? ["Copyleaks credentials", "MongoDB Atlas", "Public HTTPS webhook", "Live provider acceptance"] : api ? integrations[api] : [],
    status: missingCapability ? "NOT IMPLEMENTED" : retained ? prior!.status : wired ? "BLOCKED" : "NOT IMPLEMENTED",
    statusReason: missingCapability ? knownLimitations[tool.id] : retained && prior!.statusReason ? prior!.statusReason : wired ? "Awaiting meaningful per-tool operation and output verification; code wiring alone is not PASS." : "Dispatcher uses ToolPlaceholder; advertised operation is not implemented.",
    knownErrors: retained && prior!.knownErrors ? prior!.knownErrors : knownLimitations[tool.id] ? [knownLimitations[tool.id]] : wired ? ["No functional result established by inventory inspection."] : ["Not implemented"],
    verification: retained ? prior!.verification : { route: "PENDING", operation: "PENDING", outputIntegrity: "PENDING", failureInputs: "PENDING", mobileAndKeyboard: "PENDING", evidence: [] },
    adminControlSupport: "Shared visibility flag and page-open count; MongoDB persistence requires configured service. Limits, maintenance and execution metrics pending.",
    seoReadiness: "Metadata/canonical/structured-data route exists; rendering and indexing policy unverified.",
    estimatedResourceUsage: "Not measured",
    priority: !wired ? "P2" : ["pdf", "image", "ai", "seo", "security"].includes(tool.category) ? "P1" : "P2",
    sourceFingerprint: fingerprint,
  };
});
const ids = new Set(tools.map((tool) => tool.id));
if (ids.size !== tools.length) throw new Error("Duplicate registry IDs detected");
const orphanDispatcherIds = [...wiring.keys()].filter((id) => !ids.has(id));
const summary = { total: rows.length, wired: rows.filter((row) => row.wired).length, placeholders: rows.filter((row) => !row.wired).length, orphanDispatcherIds,
  statuses: Object.fromEntries(["PASS", "FAIL", "BLOCKED", "NOT IMPLEMENTED"].map((status) => [status, rows.filter((row) => row.status === status).length])) };
mkdirSync(path.resolve(root, "docs"), { recursive: true });
writeFileSync(matrixPath, `${JSON.stringify({ schemaVersion: 1, methodology: "Imported registry and TypeScript AST dispatcher/source-graph inspection; no functional PASS inferred. BLOCKED includes pending verification, not only external dependencies. Existing evidence retained only while tracked source fingerprint matches.", summary,
  requiredChecks: ["Page load", "Interface", "Input validation", "Advertised operation", "Output correctness", "Download integrity", "Formats", "Invalid input", "Empty input", "Large input", "Unsupported formats", "Progress states", "Cancellation where applicable", "Timeouts", "Repeated-use resources", "Mobile/desktop", "Keyboard accessibility", "Temporary cleanup", "Limits", "No hardcoded mock success"], tools: rows }, null, 2)}\n`);
const escape = (value: unknown) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
const markdown = ["# Tool inventory", "", `Discovered **${summary.total}** unique registry tools: **${summary.wired}** wired and **${summary.placeholders}** placeholders; **${orphanDispatcherIds.length}** orphan dispatcher IDs.`, "", "Generated with `node --import tsx scripts/generate-tool-inventory.ts`. Source: imported `lib/tools.ts`, TypeScript AST of `tools/index.tsx`, and transitive local imports. Re-running does not infer successful operations from component presence. Source fingerprints invalidate retained functional evidence when tracked code changes.", "", "The machine-readable [test matrix](tool-test-matrix.json) contains dependencies, external requirements, conservative processing strategy, known limitations, test dimensions, admin support and source fingerprints for every tool. Shared-module dependency graphs may include dependencies used by sibling tools. Runtime is internal registry configuration, not a visitor execution choice.", "", "BLOCKED means meaningful functional verification is pending; external requirements are separately recorded. NOT IMPLEMENTED means a placeholder or an explicitly missing advertised capability. No operational PASS has been inferred from prior audit maturity labels.", "", "All rows currently have shared admin visibility/page-open counting only. Persistence requires MongoDB; configurable limits, maintenance, execution metrics and audit history remain pending. SEO metadata exists at the shared route but indexing/rendering is unverified. Resource usage has not been measured.", "", "| ID | Name | Category | URL | Component | Implementation | API | Processing | Status | Priority |", "|---|---|---|---|---|---|---|---|---|---|", ...rows.map((row) => `| ${[row.id, row.name, row.category, row.publicUrl, row.component, row.implementationFile, row.associatedApiEndpoint, row.processingStrategy, row.status, row.priority].map(escape).join(" | ")} |`), ""];
writeFileSync(path.resolve(root, "docs/tool-inventory.md"), markdown.join("\n"));
console.log(JSON.stringify(summary));
