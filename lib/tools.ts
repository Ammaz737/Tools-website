export const categories = [
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
] as const;

export type Category = (typeof categories)[number];
export type Runtime = "client" | "server";

export interface Tool {
  id: string;
  name: string;
  category: Category;
  blurb: string;
  runtime: Runtime;
  keywords: string[];
  accepts?: string[];
  featured?: boolean;
  new?: boolean;
}

export interface CategoryMeta {
  name: string;
  description: string;
  accent: string;
  icon: string;
}

const t = (
  id: string,
  name: string,
  category: Category,
  runtime: Runtime,
  blurb: string,
  keywords: string[],
  options: Partial<Pick<Tool, "accepts" | "featured" | "new">> = {},
): Tool => ({
  id,
  name,
  category,
  runtime,
  blurb,
  keywords,
  ...options,
});

export const categoryMeta: Record<Category, CategoryMeta> = {
  pdf: {
    name: "PDF",
    description: "Merge, split, convert, protect, and edit PDFs.",
    accent: "#C53030",
    icon: "FileText",
  },
  image: {
    name: "Image",
    description: "Convert, compress, resize, crop, and refine images.",
    accent: "#2F855A",
    icon: "Image",
  },
  ai: {
    name: "AI",
    description: "Write, summarize, rewrite, translate, and assist with text.",
    accent: "#6B46C1",
    icon: "Sparkles",
  },
  text: {
    name: "Text",
    description: "Count, clean, sort, transform, and generate text.",
    accent: "#2B6CB0",
    icon: "CaseSensitive",
  },
  developer: {
    name: "Developer",
    description: "Format, validate, encode, hash, and inspect code data.",
    accent: "#2D3748",
    icon: "Code2",
  },
  seo: {
    name: "SEO",
    description: "Generate tags, previews, schema, and search helpers.",
    accent: "#B7791F",
    icon: "Search",
  },
  security: {
    name: "Security",
    description: "Generate passwords and inspect domains, DNS, and SSL.",
    accent: "#4A5568",
    icon: "Shield",
  },
  converters: {
    name: "Converters",
    description: "Convert currency, units, dates, formats, and values.",
    accent: "#0987A0",
    icon: "ArrowLeftRight",
  },
  calculators: {
    name: "Calculators",
    description: "Run financial, health, and everyday calculations.",
    accent: "#805AD5",
    icon: "Calculator",
  },
  utilities: {
    name: "Utilities",
    description: "Practical everyday tools for codes, timing, notes, and more.",
    accent: "#DD6B20",
    icon: "Wrench",
  },
};

export const tools: Tool[] = [
  t("pdf-to-word", "PDF to Word", "pdf", "client", "Turn PDFs into Word documents with layout-preserving conversion.", ["pdf", "word", "docx"], { accepts: [".pdf"] }),
  t("word-to-pdf", "Word to PDF", "pdf", "client", "Convert DOCX files to PDF in your browser.", ["word", "pdf", "docx"], { accepts: [".doc", ".docx"] }),
  t("pdf-to-excel", "PDF to Excel", "pdf", "client", "Export PDF text into Excel spreadsheets.", ["pdf", "excel", "xlsx"], { accepts: [".pdf"] }),
  t("excel-to-pdf", "Excel to PDF", "pdf", "client", "Convert spreadsheets into PDF files in your browser.", ["excel", "pdf", "xlsx"], { accepts: [".xls", ".xlsx"] }),
  t("pdf-to-powerpoint", "PDF to PowerPoint", "pdf", "client", "Convert PDF pages into PowerPoint slides.", ["pdf", "powerpoint", "pptx"], { accepts: [".pdf"] }),
  t("powerpoint-to-pdf", "PowerPoint to PDF", "pdf", "client", "Convert PPTX decks into PDFs in your browser.", ["powerpoint", "pdf", "pptx"], { accepts: [".ppt", ".pptx"] }),
  t("pdf-to-jpg", "PDF to JPG", "pdf", "client", "Render PDF pages as JPG images.", ["pdf", "jpg", "image"], { accepts: [".pdf"], featured: true }),
  t("jpg-to-pdf", "JPG to PDF", "pdf", "client", "Combine JPG images into one PDF.", ["jpg", "pdf", "images"], { accepts: [".jpg", ".jpeg"], featured: true }),
  t("png-to-pdf", "PNG to PDF", "pdf", "client", "Combine PNG images into a PDF.", ["png", "pdf", "images"], { accepts: [".png"] }),
  t("pdf-to-png", "PDF to PNG", "pdf", "client", "Render PDF pages as lossless PNGs.", ["pdf", "png", "image"], { accepts: [".pdf"] }),
  t("merge-pdf", "Merge PDF", "pdf", "client", "Combine multiple PDFs in your browser.", ["merge", "pdf", "combine"], { accepts: [".pdf"], featured: true }),
  t("split-pdf", "Split PDF", "pdf", "client", "Split a PDF by ranges, pages, or intervals.", ["split", "pdf", "pages"], { accepts: [".pdf"], featured: true }),
  t("compress-pdf", "Compress PDF", "pdf", "client", "Reduce PDF size with browser-first compression.", ["compress", "pdf", "optimize"], { accepts: [".pdf"] }),
  t("rotate-pdf", "Rotate PDF", "pdf", "client", "Rotate all or selected PDF pages.", ["rotate", "pdf", "pages"], { accepts: [".pdf"] }),
  t("unlock-pdf", "Unlock PDF", "pdf", "client", "Unlock protected PDFs you own.", ["unlock", "pdf", "password"], { accepts: [".pdf"] }),
  t("protect-pdf", "Protect PDF", "pdf", "client", "Add a password and restrictions to a PDF.", ["protect", "pdf", "password"], { accepts: [".pdf"] }),
  t("edit-pdf", "Edit PDF", "pdf", "client", "Add text, marks, images, and edits to PDF pages.", ["edit", "pdf", "annotate"], { accepts: [".pdf"], new: true }),
  t("ocr-pdf", "OCR PDF", "pdf", "client", "Make scanned PDFs searchable with OCR.", ["ocr", "pdf", "scan"], { accepts: [".pdf"] }),
  t("sign-pdf", "Sign PDF", "pdf", "client", "Add a drawn, typed, or uploaded signature.", ["sign", "pdf", "signature"], { accepts: [".pdf"] }),
  t("watermark-pdf", "Watermark PDF", "pdf", "client", "Stamp text or image watermarks onto PDFs.", ["watermark", "pdf", "stamp"], { accepts: [".pdf"] }),
  t("delete-pdf-pages", "Delete PDF Pages", "pdf", "client", "Remove selected pages from a PDF.", ["delete", "pdf", "pages"], { accepts: [".pdf"] }),
  t("rearrange-pdf-pages", "Rearrange PDF Pages", "pdf", "client", "Reorder pages visually and export a new PDF.", ["reorder", "pdf", "pages"], { accepts: [".pdf"] }),

  t("image-compressor", "Image Compressor", "image", "client", "Compress JPG, PNG, and WebP images locally.", ["image", "compress", "optimize"], { accepts: [".jpg", ".jpeg", ".png", ".webp"], featured: true }),
  t("image-resizer", "Image Resizer", "image", "client", "Resize images by dimensions or percentage.", ["image", "resize", "scale"], { accepts: [".jpg", ".jpeg", ".png", ".webp"], featured: true }),
  t("crop-image", "Crop Image", "image", "client", "Crop images with freeform and preset aspect ratios.", ["crop", "image", "aspect"], { accepts: [".jpg", ".jpeg", ".png", ".webp"] }),
  t("rotate-image", "Rotate Image", "image", "client", "Rotate and flip image files in the browser.", ["rotate", "image", "flip"], { accepts: [".jpg", ".jpeg", ".png", ".webp"] }),
  t("convert-image", "Convert Image", "image", "client", "Convert images between common formats.", ["convert", "image", "jpg"], { accepts: [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"] }),
  t("jpg-to-png", "JPG to PNG", "image", "client", "Convert JPG images to PNG.", ["jpg", "png", "convert"], { accepts: [".jpg", ".jpeg"] }),
  t("png-to-jpg", "PNG to JPG", "image", "client", "Convert PNG images to JPG.", ["png", "jpg", "convert"], { accepts: [".png"] }),
  t("webp-converter", "WebP Converter", "image", "client", "Convert to and from WebP.", ["webp", "convert", "image"], { accepts: [".webp", ".jpg", ".jpeg", ".png"] }),
  t("webp-to-jpg", "WebP to JPG", "image", "client", "Convert WebP files to JPG.", ["webp", "jpg", "convert"], { accepts: [".webp"] }),
  t("webp-to-png", "WebP to PNG", "image", "client", "Convert WebP files to PNG.", ["webp", "png", "convert"], { accepts: [".webp"] }),
  t("jfif-to-png", "JFIF to PNG", "image", "client", "Convert JFIF images to PNG.", ["jfif", "png", "convert"], { accepts: [".jfif"] }),
  t("jpeg-to-jpg", "JPEG to JPG", "image", "client", "Re-export JPEG files as JPG.", ["jpeg", "jpg", "convert"], { accepts: [".jpeg"] }),
  t("heic-to-jpg", "HEIC to JPG", "image", "client", "Convert iPhone HEIC images to JPG.", ["heic", "jpg", "iphone"], { accepts: [".heic"] }),
  t("svg-converter", "SVG Converter", "image", "client", "Export SVG artwork as PNG or JPG.", ["svg", "png", "jpg"], { accepts: [".svg"] }),
  t("background-remover", "Background Remover", "image", "client", "Remove the background from an image.", ["background", "remove", "image"], { accepts: [".jpg", ".jpeg", ".png"], new: true }),
  t("image-upscaler", "Image Upscaler", "image", "client", "Upscale images with browser-first enhancement.", ["upscale", "image", "enhance"], { accepts: [".jpg", ".jpeg", ".png"] }),
  t("image-to-pdf", "Image to PDF", "image", "client", "Turn images into a PDF document.", ["image", "pdf", "convert"], { accepts: [".jpg", ".jpeg", ".png"], featured: true }),
  t("screenshot-tool", "Screenshot Tool", "image", "client", "Capture or upload a screenshot and annotate it.", ["screenshot", "annotate", "image"], { new: true }),

  t("ai-detector", "AI Detector", "ai", "server", "Estimate whether text reads like AI output.", ["ai", "detector", "text"]),
  t("plagiarism-checker", "Plagiarism Checker", "ai", "server", "Check text against configured similarity sources.", ["plagiarism", "similarity", "text"]),
  t("grammar-checker", "Grammar Checker", "ai", "server", "Improve grammar, punctuation, and wording.", ["grammar", "writing", "text"], { featured: true }),
  t("spell-checker", "Spell Checker", "ai", "server", "Find spelling mistakes and suggest corrections.", ["spell", "checker", "text"]),
  t("paraphrasing-tool", "Paraphrasing Tool", "ai", "server", "Rewrite sentences while keeping the meaning.", ["paraphrase", "rewrite", "text"]),
  t("article-rewriter", "Article Rewriter", "ai", "server", "Rewrite longer articles in a new voice.", ["article", "rewrite", "content"]),
  t("ai-summarizer", "AI Summarizer", "ai", "server", "Summarize long text into concise output.", ["summary", "ai", "text"], { featured: true }),
  t("ai-writer", "AI Writer", "ai", "server", "Generate drafts from a prompt and tone settings.", ["ai", "writer", "content"]),
  t("ai-humanizer", "AI Humanizer", "ai", "server", "Make generated text read more naturally.", ["humanize", "ai", "writing"]),
  t("ai-translator", "AI Translator", "ai", "server", "Translate text between many languages.", ["translate", "language", "ai"]),
  t("ai-email-writer", "AI Email Writer", "ai", "server", "Draft clear emails from bullet points.", ["email", "writer", "ai"]),

  t("case-converter", "Case Converter", "text", "client", "Switch text between common casing styles.", ["case", "converter", "text"], { featured: true }),
  t("word-counter", "Word Counter", "text", "client", "Count words, characters, and reading time.", ["word", "counter", "text"], { featured: true }),
  t("character-counter", "Character Counter", "text", "client", "Count characters with and without spaces.", ["character", "counter", "text"]),
  t("sentence-counter", "Sentence Counter", "text", "client", "Count sentences and average sentence length.", ["sentence", "counter", "text"]),
  t("remove-duplicate-lines", "Remove Duplicate Lines", "text", "client", "Deduplicate repeated lines from text.", ["duplicate", "lines", "text"]),
  t("text-sorter", "Text Sorter", "text", "client", "Sort lines alphabetically, numerically, or by length.", ["sort", "text", "lines"]),
  t("text-cleaner", "Text Cleaner", "text", "client", "Clean whitespace, HTML tags, and messy text.", ["clean", "text", "whitespace"]),
  t("lorem-ipsum-generator", "Lorem Ipsum Generator", "text", "client", "Generate placeholder paragraphs or sentences.", ["lorem", "ipsum", "placeholder"]),
  t("random-text-generator", "Random Text Generator", "text", "client", "Create random words and strings.", ["random", "text", "generator"]),
  t("remove-extra-spaces", "Remove Extra Spaces", "text", "client", "Collapse repeated spaces and blank lines.", ["spaces", "cleanup", "text"]),
  t("reverse-text", "Reverse Text", "text", "client", "Reverse text by characters or words.", ["reverse", "text", "words"]),

  t("json-formatter", "JSON Formatter", "developer", "client", "Format JSON with readable indentation.", ["json", "formatter", "developer"], { featured: true }),
  t("json-validator", "JSON Validator", "developer", "client", "Validate JSON and show exact errors.", ["json", "validator", "developer"], { featured: true }),
  t("json-minifier", "JSON Minifier", "developer", "client", "Minify JSON and reduce payload size.", ["json", "minifier", "developer"]),
  t("xml-formatter", "XML Formatter", "developer", "client", "Pretty-print XML input.", ["xml", "formatter", "developer"]),
  t("xml-validator", "XML Validator", "developer", "client", "Validate XML structure and syntax.", ["xml", "validator", "developer"]),
  t("html-formatter", "HTML Formatter", "developer", "client", "Beautify HTML markup in the browser.", ["html", "formatter", "developer"]),
  t("html-minifier", "HTML Minifier", "developer", "client", "Minify HTML for smaller output.", ["html", "minify", "developer"]),
  t("css-minifier", "CSS Minifier", "developer", "client", "Compress CSS for production use.", ["css", "minify", "developer"]),
  t("javascript-minifier", "JavaScript Minifier", "developer", "client", "Minify JavaScript client-side.", ["javascript", "minify", "developer"]),
  t("sql-formatter", "SQL Formatter", "developer", "client", "Format SQL with readable structure.", ["sql", "formatter", "developer"]),
  t("base64-encoder", "Base64 Encoder", "developer", "client", "Encode text or files to Base64.", ["base64", "encode", "developer"]),
  t("base64-decoder", "Base64 Decoder", "developer", "client", "Decode Base64 into text or files.", ["base64", "decode", "developer"]),
  t("url-encoder", "URL Encoder", "developer", "client", "Encode unsafe URL characters.", ["url", "encode", "developer"]),
  t("url-decoder", "URL Decoder", "developer", "client", "Decode encoded URL strings.", ["url", "decode", "developer"]),
  t("jwt-decoder", "JWT Decoder", "developer", "client", "Decode JWT header and payload locally.", ["jwt", "token", "developer"]),
  t("uuid-generator", "UUID Generator", "developer", "client", "Generate UUIDs in bulk.", ["uuid", "generator", "developer"]),
  t("hash-generator", "Hash Generator", "developer", "client", "Generate hashes for text or files.", ["hash", "sha", "md5"]),
  t("md5-generator", "MD5 Generator", "developer", "client", "Generate an MD5 hash.", ["md5", "hash", "developer"]),
  t("sha256-generator", "SHA-256 Generator", "developer", "client", "Generate a SHA-256 hash.", ["sha256", "hash", "developer"]),

  t("meta-tag-generator", "Meta Tag Generator", "seo", "client", "Generate title, meta, OG, and Twitter tags.", ["meta", "seo", "og"]),
  t("robots-txt-generator", "Robots.txt Generator", "seo", "client", "Build a clean robots.txt file.", ["robots", "seo", "txt"]),
  t("sitemap-generator", "Sitemap Generator", "seo", "server", "Generate a sitemap from URLs or a crawl.", ["sitemap", "seo", "xml"]),
  t("keyword-density-checker", "Keyword Density Checker", "seo", "server", "Measure keyword density in text or URLs.", ["keyword", "density", "seo"]),
  t("serp-preview-tool", "SERP Preview Tool", "seo", "client", "Preview how titles and descriptions look in search.", ["serp", "preview", "seo"]),
  t("open-graph-generator", "Open Graph Generator", "seo", "client", "Generate social meta tags and preview cards.", ["open graph", "twitter", "seo"]),
  t("canonical-tag-generator", "Canonical Tag Generator", "seo", "client", "Generate canonical link tags.", ["canonical", "seo", "tag"]),
  t("schema-markup-generator", "Schema Markup Generator", "seo", "client", "Generate JSON-LD markup for common types.", ["schema", "json-ld", "seo"]),
  t("website-speed-test", "Website Speed Test", "seo", "server", "Check timing and speed metrics for a URL.", ["speed", "performance", "seo"]),
  t("broken-link-checker", "Broken Link Checker", "seo", "server", "Crawl a page and report broken links.", ["broken links", "crawl", "seo"]),

  t("password-generator", "Password Generator", "security", "client", "Generate strong random passwords.", ["password", "generator", "security"]),
  t("password-strength-checker", "Password Strength Checker", "security", "client", "Estimate password strength and entropy.", ["password", "strength", "security"]),
  t("ssl-checker", "SSL Checker", "security", "server", "Inspect SSL certificate validity and issuer.", ["ssl", "certificate", "security"]),
  t("whois-lookup", "WHOIS Lookup", "security", "server", "Look up domain registration details.", ["whois", "domain", "security"]),
  t("dns-lookup", "DNS Lookup", "security", "server", "Query DNS records for a domain.", ["dns", "domain", "security"]),
  t("ip-lookup", "IP Lookup", "security", "server", "Inspect IP geolocation and network information.", ["ip", "lookup", "security"]),
  t("email-validator", "Email Validator", "security", "server", "Validate email syntax and mail records.", ["email", "validator", "security"]),

  t("currency-converter", "Currency Converter", "converters", "server", "Convert currencies using cached live rates.", ["currency", "converter", "rates"], { featured: true }),
  t("length-converter", "Length Converter", "converters", "client", "Convert meters, feet, miles, and more.", ["length", "converter", "units"]),
  t("weight-converter", "Weight Converter", "converters", "client", "Convert kilograms, pounds, grams, and more.", ["weight", "converter", "units"]),
  t("area-converter", "Area Converter", "converters", "client", "Convert square units, acres, and hectares.", ["area", "converter", "units"]),
  t("temperature-converter", "Temperature Converter", "converters", "client", "Convert temperature units instantly.", ["temperature", "converter", "units"]),
  t("time-zone-converter", "Time Zone Converter", "converters", "client", "Convert time across global zones.", ["timezone", "converter", "time"]),
  t("data-storage-converter", "Data Storage Converter", "converters", "client", "Convert bits, bytes, and storage units.", ["data", "storage", "converter"]),
  t("binary-converter", "Binary Converter", "converters", "client", "Convert between text, binary, hex, and decimal.", ["binary", "hex", "converter"]),
  t("roman-numeral-converter", "Roman Numeral Converter", "converters", "client", "Convert numbers to and from Roman numerals.", ["roman", "numeral", "converter"]),

  t("age-calculator", "Age Calculator", "calculators", "client", "Calculate age in years, months, and days.", ["age", "calculator", "date"]),
  t("bmi-calculator", "BMI Calculator", "calculators", "client", "Calculate body mass index and category.", ["bmi", "calculator", "health"]),
  t("percentage-calculator", "Percentage Calculator", "calculators", "client", "Solve common percentage calculations.", ["percentage", "calculator", "math"]),
  t("emi-calculator", "EMI Calculator", "calculators", "client", "Calculate equated monthly installments.", ["emi", "loan", "calculator"]),
  t("loan-calculator", "Loan Calculator", "calculators", "client", "Estimate loan payments and total interest.", ["loan", "calculator", "finance"]),
  t("gst-calculator", "GST Calculator", "calculators", "client", "Add or remove GST from a price.", ["gst", "calculator", "tax"]),
  t("vat-calculator", "VAT Calculator", "calculators", "client", "Add or remove VAT from a price.", ["vat", "calculator", "tax"]),
  t("discount-calculator", "Discount Calculator", "calculators", "client", "Calculate discounts and savings.", ["discount", "calculator", "price"]),
  t("profit-calculator", "Profit Calculator", "calculators", "client", "Calculate profit, margin, and markup.", ["profit", "margin", "calculator"]),
  t("scientific-calculator", "Scientific Calculator", "calculators", "client", "Handle everyday and scientific math.", ["scientific", "calculator", "math"]),
  t("date-calculator", "Date Calculator", "calculators", "client", "Add, subtract, and compare dates.", ["date", "calculator", "time"]),
  t("mortgage-calculator", "Mortgage Calculator", "calculators", "client", "Estimate mortgage payments and totals.", ["mortgage", "calculator", "finance"]),
  t("roi-calculator", "ROI Calculator", "calculators", "client", "Calculate return on investment.", ["roi", "calculator", "finance"]),
  t("tip-calculator", "Tip Calculator", "calculators", "client", "Split bills and calculate tips.", ["tip", "calculator", "bill"]),
  t("margin-calculator", "Margin Calculator", "calculators", "client", "Solve pricing with margin and markup.", ["margin", "markup", "calculator"]),

  t("qr-code-generator", "QR Code Generator", "utilities", "client", "Create QR codes for text, links, and more.", ["qr", "code", "generator"], { featured: true }),
  t("barcode-generator", "Barcode Generator", "utilities", "client", "Generate barcodes in common formats.", ["barcode", "generator", "utility"]),
  t("color-picker", "Color Picker", "utilities", "client", "Pick colors and copy multiple color formats.", ["color", "picker", "utility"]),
  t("color-converter", "Color Converter", "utilities", "client", "Convert HEX, RGB, HSL, HSV, and CMYK.", ["color", "converter", "utility"]),
  t("uuid-generator-util", "UUID Generator", "utilities", "client", "Generate UUIDs with a simpler utility UI.", ["uuid", "generator", "utility"]),
  t("random-number-generator", "Random Number Generator", "utilities", "client", "Generate random numbers in ranges.", ["random", "number", "generator"]),
  t("random-password-generator", "Random Password Generator", "utilities", "client", "Generate passwords from simple utility controls.", ["random", "password", "generator"]),
  t("timestamp-converter", "Timestamp Converter", "utilities", "client", "Convert dates and Unix timestamps.", ["timestamp", "converter", "utility"]),
  t("unix-time-converter", "Unix Time Converter", "utilities", "client", "Convert Unix time into readable dates.", ["unix", "time", "converter"]),
  t("coin-flipper", "Coin Flipper", "utilities", "client", "Flip a virtual coin and track streaks.", ["coin", "flip", "utility"]),
  t("dice-roller", "Dice Roller", "utilities", "client", "Roll one or more dice with history.", ["dice", "roller", "utility"]),
  t("stopwatch", "Stopwatch", "utilities", "client", "Track elapsed time with laps.", ["stopwatch", "timer", "utility"]),
  t("timer", "Timer", "utilities", "client", "Run countdown timers with alerts.", ["timer", "countdown", "utility"]),
  t("notepad-online", "Notepad Online", "utilities", "client", "Write notes and save them locally.", ["notepad", "notes", "utility"]),
  t("todo-list-online", "Todo List Online", "utilities", "client", "Manage simple tasks in local storage.", ["todo", "tasks", "utility"]),
];

export const toolCount = tools.length;

export const featuredTools = tools.filter((tool) => tool.featured).slice(0, 12);
export const newTools = tools.filter((tool) => tool.new).slice(0, 6);

export function getToolById(id: string) {
  return tools.find((tool) => tool.id === id);
}

export function getToolsByCategory(category: Category) {
  return tools.filter((tool) => tool.category === category);
}

export function getRelatedTools(tool: Tool, limit = 4) {
  return tools
    .filter((entry) => entry.category === tool.category && entry.id !== tool.id)
    .slice(0, limit);
}

export function getCategoryCount(category: Category) {
  return getToolsByCategory(category).length;
}
