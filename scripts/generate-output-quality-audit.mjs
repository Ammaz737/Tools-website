import { readFile, writeFile } from "node:fs/promises";

const inventory = JSON.parse(await readFile("docs/tool-test-matrix.json", "utf8"));
const criteria = {
  pdf: "Compare source/output page count, order, dimensions, text, fonts, tables, graphics and clipping; render downloaded output; test scans, mixed orientation and blank pages.",
  image: "Decode downloaded bytes independently; check format, dimensions, orientation, alpha and known pixel locations; compare visual quality and verify advertised edit.",
  calculators: "Compare independent reference calculations, units, rounding, zero/negative/decimal/extreme inputs and domain boundaries.",
  converters: "Compare independent unit/encoding reference and round trip, precision, invalid values and boundary conditions.",
  developer: "Parse output independently, check semantic equivalence and escaping, malformed syntax, Unicode and repeated execution.",
  text: "Compare exact expected text including Unicode, whitespace, punctuation and empty inputs; independently check statistics.",
  utilities: "Verify actual behavior and exported content; check state transitions, time, persistence, random range and repeated/reset operations.",
  security: "Verify known vectors or independently decoded output; check cryptographic randomness, encodings and invalid input.",
  seo: "Parse generated output, validate escaping and schema/protocol syntax, check user values and rendered previews against exports.",
  ai: "Run real provider, assess task-specific accuracy with reference examples, check hallucinations, invalid inputs, timeouts and repeated calls.",
};
const findings = {
  "pdf-to-word": "Editable mode reconstructs horizontal text and detected tables; source graphics, exact fonts and complex columns are not retained. Page-image mixed-size round trip and editable table fixtures pass. Generated page-image/table fixtures independently rendered in local LibreOffice; Microsoft Word compatibility and arbitrary layouts remain unverified.",
  "word-to-pdf": "Browser rendering passes scoped editable/image-page fixtures. Local authenticated LibreOffice fixtures now pass actual conversion and visual checks; broader font/layout and deployed acceptance remain pending.",
  "pdf-to-excel": "Detected aligned table cells and blank-middle-page ordering pass real downloaded XLSX assertions. Formulas, original styles and complex tables are not reconstructed.",
  "excel-to-pdf": "Browser raster rendering is limited for print areas/charts/pagination. Local native two-sheet/formula fixture passes after fixing stale cache recalculation; complex charts/print ranges and Excel-specific functions remain pending.",
  "powerpoint-to-pdf": "Supported one-image slides preserve declared dimensions; mixed image/text slides safely rejected by browser fallback. Local native mixed-content two-slide fixture passes text, image, dimensions and visual checks; SmartArt, exact fonts and arbitrary presentations remain pending.",
  "pdf-to-powerpoint": "Raster slide images preserve content in scoped round trip; slide objects are not editable. Mixed source dimensions use one presentation slide size.",
  "heic-to-jpg": "Real self-hosted decoder passes primary-image, pixel, dimension and malformed-recovery assertions. Independent native decoder comparison passes. Multi-image/metadata/animation preservation is not provided.",
  "plagiarism-checker": "Dedicated Copyleaks asynchronous integration implemented. Credentials, Atlas and authenticated public webhook acceptance are required; sandbox is not a real similarity check.",
  "ocr-pdf": "Actual two-page English printed-scan TXT and searchable PDF accuracy passes with local assets and one worker. Handwriting, other languages and precise text positioning are not certified.",
};
const tools = inventory.tools.map(tool => ({
  id: tool.id,
  name: tool.name,
  priorScopedStatus: tool.status,
  priorEvidence: tool.verification?.evidence ?? [],
  outputQualityStatus: tool.status === "BLOCKED" ? "BLOCKED" : findings[tool.id] ? "SCOPED_PASS_WITH_LIMITATIONS" : tool.status === "PASS" ? "SCOPED_PASS" : "REVIEW_PENDING",
  requiredVerification: criteria[tool.category] ?? "Verify real output against independent expected results, invalid inputs and repeated use.",
  finding: findings[tool.id] ?? "Previous scoped tests are evidence only for their assertions; comprehensive behavior and output quality have not been certified.",
}));
await writeFile("docs/output-quality-matrix.json", JSON.stringify({
  total: tools.length,
  methodology: "Separate from smoke/operation PASS. No perfect or comprehensive output-quality PASS inferred from a successful download. Read OUTPUT_QUALITY_AUDIT.md for current observed results and limits.",
  tools,
}, null, 2) + "\n");
await writeFile("docs/output-quality-checklist.md", "# Output quality review for all 137 tools\n\nGenerated from the registry inventory. Every row records scoped evidence and still requires the stated comprehensive acceptance; functional evidence is retained in output-quality-matrix.json.\n\n| Tool | Prior scoped result | Quality review | Required check |\n|---|---|---|---|\n" + tools.map(tool => `| ${tool.id} | ${tool.priorScopedStatus} | ${tool.outputQualityStatus} | ${tool.requiredVerification} |`).join("\n") + "\n");
console.log(`Recorded ${tools.length} tools; no comprehensive output-quality PASS inferred.`);
