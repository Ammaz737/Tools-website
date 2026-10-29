import { isMongoConfigured } from "@/lib/db";
import type { Metadata } from "next";

import { categoryMeta, type Category, type Tool } from "@/lib/tools";
import { isImplementedTool } from "@/lib/tool-capabilities";
import { siteOrigin } from "@/lib/site-config";
import type { BlogPost } from "@/lib/blog";

export function isToolIndexable(tool: Tool): boolean {
  if (!isImplementedTool(tool.id)) return false;
  // Production provider calls require shared Atlas quota accounting.
  if (tool.category === "ai" && !isMongoConfigured()) return false;
  if (tool.id === "plagiarism-checker") {
    let originValid = false;
    try { const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || ""); originValid = origin.protocol === "https:" && !origin.username && !origin.password && origin.pathname === "/" && !origin.search && !origin.hash && !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname); } catch {}
    return originValid && Boolean(process.env.COPYLEAKS_EMAIL?.trim() && process.env.COPYLEAKS_API_KEY?.trim() && process.env.MONGODB_URI?.trim()) && (process.env.COPYLEAKS_WEBHOOK_SECRET?.trim().length || 0) >= 32 && process.env.COPYLEAKS_SANDBOX === "false";
  }
  if (tool.category !== "ai") return true;
  const provider = (process.env.AI_PROVIDER || "auto").toLowerCase();
  return ((provider === "auto" || provider === "openai") && Boolean(process.env.OPENAI_API_KEY?.trim())) ||
    ((provider === "auto" || provider === "gemini") && Boolean(process.env.GEMINI_API_KEY?.trim())) ||
    ((provider === "auto" || provider === "ollama") && Boolean(process.env.OLLAMA_BASE_URL?.trim() && process.env.OLLAMA_MODEL?.trim()));
}

const siteName = "ALETOOL";
const siteDescription =
  "137 free online tools: merge, split, and compress PDFs, convert images, check AI writing, calculate loans, and more. No signup, no watermark. Most tools run in your browser.";

/**
 * Hreflang alternates for English-search markets (US, UK, Canada,
 * Australia). The site is English-only, so every locale points at the
 * same URL; x-default covers all other English searchers.
 */
export function languageAlternates(path: string): Record<string, string> {
  return {
    "en-US": path,
    "en-GB": path,
    "en-CA": path,
    "en-AU": path,
    "x-default": path,
  };
}

/**
 * Dynamic OG image URL (app/og/route.tsx). Relative so it resolves
 * against metadataBase; never hardcodes a domain.
 */
export function ogImageUrl(
  title: string,
  subtitle = "",
  tag = "Free online tools",
): string {
  const params = new URLSearchParams({ title, tag });
  if (subtitle) params.set("subtitle", subtitle);
  return `/og?${params.toString()}`;
}

export function buildSiteMetadata(): Metadata {
  const ogImage = ogImageUrl(
    "137 Free Online Tools, No Signup",
    "PDF, image, AI, text, developer, SEO, security, converter, calculator & utility tools.",
  );
  return {
    applicationName: siteName,
    metadataBase: new URL(siteOrigin()),
    title: {
      default: `${siteName} — 137 Free Online Tools, No Signup`,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    openGraph: {
      locale: "en_US",
      type: "website",
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImage],
    },
  };
}

/**
 * Keyword-targeted title/description overrides for the highest-value
 * tools. Titles target "[tool] online free" phrasing used by US, UK,
 * Canadian, and Australian searchers; descriptions stay honest about
 * what each tool actually does.
 */
const seoOverrides: Record<string, { title: string; description: string }> = {
  "merge-pdf": {
    title: "Merge PDF Online Free — Combine PDF Files",
    description:
      "Merge PDF files online free in your browser. Combine multiple PDFs into one document in any order. No signup, no watermark, files never leave your device.",
  },
  "split-pdf": {
    title: "Split PDF Online Free — Extract Pages from PDF",
    description:
      "Split PDF online free by page ranges or intervals. Extract pages into separate PDFs in your browser. No signup, no watermark, fully private.",
  },
  "compress-pdf": {
    title: "Compress PDF Online Free — Reduce PDF File Size",
    description:
      "Compress PDF online free and shrink file size while keeping quality. Browser-first compression with no signup, no watermark, and no uploads.",
  },
  "pdf-to-word": {
    title: "PDF to Word Converter Online Free — PDF to DOCX",
    description:
      "Convert PDF to Word online free with layout-preserving conversion. Turn PDF documents into DOCX files in your browser. No signup, no watermark.",
  },
  "word-to-pdf": {
    title: "Word to PDF Converter Online Free — DOCX to PDF",
    description:
      "Convert Word to PDF online free in your browser. Turn DOCX documents into PDF files without uploading them. No signup, no watermark.",
  },
  "edit-pdf": {
    title: "Edit PDF Online Free — Add Text, Images & Marks",
    description:
      "Edit PDF online free: add text, marks, and images to PDF pages in your browser. No signup, no watermark, files stay on your device.",
  },
  "sign-pdf": {
    title: "Sign PDF Online Free — Electronic Signature",
    description:
      "Sign PDF online free with a drawn, typed, or uploaded signature. Add your electronic signature to PDF documents in your browser. No signup.",
  },
  "pdf-to-jpg": {
    title: "PDF to JPG Converter Online Free — PDF to Images",
    description:
      "Convert PDF to JPG online free. Render PDF pages as high-quality JPG images in your browser. No signup, no watermark, fully private.",
  },
  "image-compressor": {
    title: "Compress Images Online Free — JPG, PNG, WebP",
    description:
      "Compress images online free: shrink JPG, PNG, and WebP files locally in your browser. Note: output is always JPEG, so PNG transparency is lost.",
  },
  "heic-to-jpg": {
    title: "HEIC to JPG Converter Online Free — iPhone Photos",
    description:
      "Convert HEIC to JPG online free. Turn iPhone HEIC photos into JPG images in your browser. No signup, no watermark, files stay private.",
  },
  "background-remover": {
    title: "Remove Background from Image Online Free",
    description:
      "Remove the background from images online free with chroma-key removal of solid-color backgrounds. Works in your browser. No signup, no watermark.",
  },
  "ai-detector": {
    title: "AI Detector Online Free — Check Text for AI Writing",
    description:
      "AI detector online free: estimate whether text reads like AI output. A probabilistic estimate, not proof. Free, no signup, results in seconds.",
  },
  "plagiarism-checker": {
    title: "Plagiarism Checker Online Free — Check for Duplicates",
    description:
      "Plagiarism checker online free: check text against configured similarity sources. Real checks need a configured provider; otherwise results are simulated.",
  },
  "paraphrasing-tool": {
    title: "Paraphrasing Tool Online Free — Rewrite Sentences",
    description:
      "Paraphrasing tool online free: rewrite sentences while keeping the meaning. Rephrase text for essays, emails, and articles. Free, no signup.",
  },
  "ai-humanizer": {
    title: "AI Humanizer Online Free — Make AI Text Sound Natural",
    description:
      "AI humanizer online free: rewrite generated text so it reads more naturally. Humanize AI drafts for blogs, essays, and emails. Free, no signup.",
  },
  "mortgage-calculator": {
    title: "Mortgage Calculator Online Free — Monthly Payments",
    description:
      "Free mortgage calculator: estimate monthly payments and total interest on your home loan. Planning estimates only, not financial advice. No signup.",
  },
  "loan-calculator": {
    title: "Loan Calculator Online Free — Payments & Interest",
    description:
      "Loan calculator online free: estimate monthly payments and total interest on personal, auto, and home loans. Planning estimates, not advice. No signup.",
  },
  "emi-calculator": {
    title: "EMI Calculator Online Free — Monthly Installments",
    description:
      "EMI calculator online free: calculate equated monthly installments for loans from principal, rate, and tenure. Planning estimates, not advice. No signup.",
  },
  "roi-calculator": {
    title: "ROI Calculator Online Free — Return on Investment",
    description:
      "ROI calculator online free: measure return on investment for projects, ads, and business spending. Instant results in your browser. Free, no signup.",
  },
  "currency-converter": {
    title: "Currency Converter Online Free — Live Exchange Rates",
    description:
      "Currency converter online free with cached live exchange rates for USD, GBP, EUR, CAD, AUD, and more. Convert money instantly. Free, no signup.",
  },
  "password-generator": {
    title: "Strong Password Generator Online Free — Random",
    description:
      "Strong password generator online free: create secure random passwords in your browser. Generated locally, never sent anywhere. Free, no signup.",
  },
  "ssl-checker": {
    title: "SSL Checker Online Free — Certificate Validity & Issuer",
    description:
      "SSL checker online free: inspect a website's SSL certificate validity, issuer, and expiry. Check any domain instantly. Free, no signup.",
  },
  "json-formatter": {
    title: "JSON Formatter Online Free — Beautify & Format JSON",
    description:
      "JSON formatter online free: format JSON with readable indentation and validate structure. Beautify JSON instantly in your browser. Free, no signup.",
  },
  "qr-code-generator": {
    title: "QR Code Generator Online Free — Create QR Codes",
    description:
      "QR code generator online free: create QR codes for text, links, Wi-Fi, and more. Download instantly in your browser. Free, no signup.",
  },
  "pdf-to-excel": {
    title: "PDF to Excel Converter Online Free — PDF to XLSX",
    description:
      "Convert PDF to Excel online free: export PDF text into XLSX spreadsheets in your browser. No signup, no watermark, files never leave your device.",
  },
  "excel-to-pdf": {
    title: "Excel to PDF Converter Online Free — XLSX to PDF",
    description:
      "Convert Excel to PDF online free in your browser. Turn XLSX spreadsheets into PDF files with local rendering. No signup, no watermark, fully private.",
  },
  "pdf-to-powerpoint": {
    title: "PDF to PowerPoint Converter Online Free — PDF to PPTX",
    description:
      "Convert PDF to PowerPoint online free: each PDF page becomes a slide image in your PPTX. Text is not separately editable. Free, no signup, browser-based.",
  },
  "powerpoint-to-pdf": {
    title: "PowerPoint to PDF Converter Online Free — PPTX to PDF",
    description:
      "Convert PowerPoint to PDF online free in your browser. Turn PPTX decks into PDF files with local rendering. No signup, no watermark, fully private.",
  },
  "jpg-to-pdf": {
    title: "JPG to PDF Converter Online Free — Images to PDF",
    description:
      "Convert JPG to PDF online free: combine JPG images into one PDF in your browser, in any order. No signup, no watermark, files stay on your device.",
  },
  "png-to-pdf": {
    title: "PNG to PDF Converter Online Free — Images to PDF",
    description:
      "Convert PNG to PDF online free: combine PNG images into a single PDF in your browser. No signup, no watermark, files never leave your device.",
  },
  "pdf-to-png": {
    title: "PDF to PNG Converter Online Free — PDF to Images",
    description:
      "Convert PDF to PNG online free. Render PDF pages as lossless PNG images in your browser. No signup, no watermark, files stay fully private.",
  },
  "rotate-pdf": {
    title: "Rotate PDF Online Free — Rotate PDF Pages Easily",
    description:
      "Rotate PDF online free: rotate all or selected PDF pages in your browser. Fix sideways pages in seconds. No signup, no watermark, fully private.",
  },
  "unlock-pdf": {
    title: "Unlock PDF Online Free — Remove PDF Password",
    description:
      "Unlock PDF online free: remove the password from PDFs you own in your browser. No signup, no watermark, files never leave your device.",
  },
  "protect-pdf": {
    title: "Protect PDF Online Free — Password Protect PDF",
    description:
      "Protect PDF online free: add a password and restrictions to PDF files in your browser. No signup, no watermark, files stay on your device.",
  },
  "ocr-pdf": {
    title: "OCR PDF Online Free — Make Scanned PDFs Searchable",
    description:
      "OCR PDF online free: make scanned PDFs searchable with browser-based text recognition. No signup, no watermark, files never leave your device.",
  },
  "watermark-pdf": {
    title: "Watermark PDF Online Free — Add Watermark to PDF",
    description:
      "Watermark PDF online free: stamp text or image watermarks onto PDF pages in your browser. No signup, files stay on your device, fully private.",
  },
  "delete-pdf-pages": {
    title: "Delete PDF Pages Online Free — Remove PDF Pages",
    description:
      "Delete PDF pages online free: remove selected pages from a PDF in your browser. No signup, no watermark, files never leave your device.",
  },
  "rearrange-pdf-pages": {
    title: "Rearrange PDF Pages Online Free — Reorder PDF",
    description:
      "Rearrange PDF pages online free: reorder pages visually and export a new PDF in your browser. No signup, no watermark, fully private.",
  },
  "image-resizer": {
    title: "Resize Image Online Free — Image Resizer by Pixels",
    description:
      "Resize images online free by dimensions or percentage in your browser. Scale JPG, PNG, and WebP files instantly. No signup, no watermark, private.",
  },
  "crop-image": {
    title: "Crop Image Online Free — Crop Photos to Any Ratio",
    description:
      "Crop images online free with freeform and preset aspect ratios in your browser. Trim photos precisely. No signup, no watermark, fully private.",
  },
  "rotate-image": {
    title: "Rotate Image Online Free — Flip & Rotate Photos",
    description:
      "Rotate images online free: rotate and flip JPG, PNG, and WebP files in your browser. Fix photo orientation instantly. No signup, no watermark.",
  },
  "convert-image": {
    title: "Convert Image Online Free — Change Image Format",
    description:
      "Convert images online free between common formats in your browser. Change JPG, PNG, WebP, BMP, and GIF files. No signup, no watermark, private.",
  },
  "jpg-to-png": {
    title: "JPG to PNG Converter Online Free — JPG to PNG",
    description:
      "Convert JPG to PNG online free in your browser. Turn JPG images into PNG files with no quality loss from conversion. No signup, no watermark.",
  },
  "png-to-jpg": {
    title: "PNG to JPG Converter Online Free — PNG to JPG",
    description:
      "Convert PNG to JPG online free in your browser. Turn PNG images into smaller JPG files instantly. No signup, no watermark, fully private.",
  },
  "webp-converter": {
    title: "WebP Converter Online Free — Convert To & From WebP",
    description:
      "WebP converter online free: convert images to and from WebP format in your browser. Smaller files, same quality. No signup, no watermark, private.",
  },
  "webp-to-jpg": {
    title: "WebP to JPG Converter Online Free — WebP to JPG",
    description:
      "Convert WebP to JPG online free in your browser. Turn WebP images into widely compatible JPG files. No signup, no watermark, fully private.",
  },
  "webp-to-png": {
    title: "WebP to PNG Converter Online Free — WebP to PNG",
    description:
      "Convert WebP to PNG online free in your browser. Turn WebP images into PNG files instantly. No signup, no watermark, files stay private.",
  },
  "jfif-to-png": {
    title: "JFIF to PNG Converter Online Free — JFIF to PNG",
    description:
      "Convert JFIF to PNG online free in your browser. Turn JFIF images into PNG files that open anywhere. No signup, no watermark, fully private.",
  },
  "jpeg-to-jpg": {
    title: "JPEG to JPG Converter Online Free — JPEG to JPG",
    description:
      "Convert JPEG to JPG online free in your browser. Re-export JPEG files with the .jpg extension instantly. No signup, no watermark, private.",
  },
  "svg-converter": {
    title: "SVG Converter Online Free — SVG to PNG & JPG",
    description:
      "SVG converter online free: export SVG artwork as PNG or JPG images in your browser. No signup, no watermark, files never leave your device.",
  },
  "image-upscaler": {
    title: "Upscale Image Online Free — Enlarge Images Sharper",
    description:
      "Upscale images online free with browser canvas resizing plus sharpening. Enlarge photos in your browser. Not AI segmentation or AI enhancement. Free.",
  },
  "image-to-pdf": {
    title: "Image to PDF Converter Online Free — Images to PDF",
    description:
      "Convert images to PDF online free: turn JPG and PNG images into a PDF document in your browser. No signup, no watermark, fully private.",
  },
  "screenshot-tool": {
    title: "Screenshot Tool Online Free — Annotate Screenshots",
    description:
      "Screenshot tool online free: upload a screenshot and annotate it in your browser. It annotates uploads only and does not capture your screen. Free.",
  },
  "grammar-checker": {
    title: "Grammar Checker Online Free — Fix Grammar & Punctuation",
    description:
      "Grammar checker online free: improve grammar, punctuation, and wording in your writing. AI features need a configured provider. Free, no signup.",
  },
  "spell-checker": {
    title: "Spell Checker Online Free — Check Spelling Mistakes",
    description:
      "Spell checker online free: find spelling mistakes and get suggested corrections. AI features need a configured provider. Free, no signup.",
  },
  "article-rewriter": {
    title: "Article Rewriter Online Free — Rewrite Articles New",
    description:
      "Article rewriter online free: rewrite longer articles in a new voice while keeping the meaning. AI features need a configured provider. No signup.",
  },
  "ai-summarizer": {
    title: "AI Summarizer Online Free — Summarize Text Fast",
    description:
      "AI summarizer online free: condense long text into concise summaries. AI features need a configured provider to produce output. Free, no signup.",
  },
  "ai-writer": {
    title: "AI Writer Online Free — Generate Drafts from Prompts",
    description:
      "AI writer online free: generate drafts from a prompt and tone settings. AI features need a configured provider to produce output. No signup.",
  },
  "ai-translator": {
    title: "AI Translator Online Free — Translate Text Instantly",
    description:
      "AI translator online free: translate text between many languages. AI features need a configured provider to produce output. Free, no signup.",
  },
  "ai-email-writer": {
    title: "AI Email Writer Online Free — Draft Emails Quickly",
    description:
      "AI email writer online free: draft clear emails from bullet points. AI features need a configured provider to produce output. Free, no signup.",
  },
  "case-converter": {
    title: "Case Converter Online Free — Change Text Case",
    description:
      "Case converter online free: switch text between uppercase, lowercase, title case, and more in your browser. No signup, instant results, free.",
  },
  "word-counter": {
    title: "Word Counter Online Free — Count Words & Reading Time",
    description:
      "Word counter online free: count words, characters, and reading time in your text instantly in your browser. No signup, free, fully private.",
  },
  "character-counter": {
    title: "Character Counter Online Free — Count Characters",
    description:
      "Character counter online free: count characters with and without spaces in your text instantly. No signup, free, runs in your browser.",
  },
  "sentence-counter": {
    title: "Sentence Counter Online Free — Count Sentences Fast",
    description:
      "Sentence counter online free: count sentences and average sentence length in your text instantly. No signup, free, runs in your browser.",
  },
  "remove-duplicate-lines": {
    title: "Remove Duplicate Lines Online Free — Deduplicate Text",
    description:
      "Remove duplicate lines online free: deduplicate repeated lines from text instantly in your browser. No signup, free, fully private.",
  },
  "text-sorter": {
    title: "Text Sorter Online Free — Sort Lines Alphabetically",
    description:
      "Text sorter online free: sort lines alphabetically, numerically, or by length, and remove blank lines in your browser. No signup, free, instant results.",
  },
  "text-cleaner": {
    title: "Text Cleaner Online Free — Clean Messy Text Fast",
    description:
      "Text cleaner online free: clean whitespace, HTML tags, and messy text in your browser. No signup, free, instant results, fully private.",
  },
  "lorem-ipsum-generator": {
    title: "Lorem Ipsum Generator Online Free — Placeholder Text",
    description:
      "Lorem ipsum generator online free: generate placeholder paragraphs or sentences for layouts and mockups. No signup, free, instant, browser-based.",
  },
  "random-text-generator": {
    title: "Random Text Generator Online Free — Random Words",
    description:
      "Random text generator online free: create random words and strings for testing and placeholders. No signup, free, runs in your browser.",
  },
  "remove-extra-spaces": {
    title: "Remove Extra Spaces Online Free — Fix Spacing",
    description:
      "Remove extra spaces online free: collapse repeated spaces and blank lines in text instantly. No signup, free, runs in your browser.",
  },
  "reverse-text": {
    title: "Reverse Text Online Free — Reverse Words & Letters",
    description:
      "Reverse text online free: reverse text by characters, words, or lines instantly in your browser. A simple, fun utility for puzzles and testing. No signup, free.",
  },
  "json-validator": {
    title: "JSON Validator Online Free — Validate JSON & Errors",
    description:
      "JSON validator online free: validate JSON and show exact errors in your browser. Check structure instantly. No signup, free, fully private.",
  },
  "json-minifier": {
    title: "JSON Minifier Online Free — Minify JSON Instantly",
    description:
      "JSON minifier online free: minify JSON and reduce payload size instantly in your browser. No signup, free, files never leave your device.",
  },
  "xml-formatter": {
    title: "XML Formatter Online Free — Pretty Print XML",
    description:
      "XML formatter online free: pretty-print XML input with readable indentation and clear nesting in your browser. No signup, free, instant results, private.",
  },
  "xml-validator": {
    title: "XML Validator Online Free — Validate XML Syntax",
    description:
      "XML validator online free: validate XML structure and syntax in your browser and find errors fast. No signup, free, fully private.",
  },
  "html-formatter": {
    title: "HTML Formatter Online Free — Beautify HTML Code",
    description:
      "HTML formatter online free: beautify HTML markup with readable indentation and clean structure in your browser. No signup, free, instant results, private.",
  },
  "html-minifier": {
    title: "HTML Minifier Online Free — Minify HTML for Speed",
    description:
      "HTML minifier online free: minify HTML for smaller output and faster-loading pages in your browser. No signup, free, fully private, instant results.",
  },
  "css-minifier": {
    title: "CSS Minifier Online Free — Compress CSS for Production",
    description:
      "CSS minifier online free: compress CSS for production use in your browser. Shrink stylesheets instantly. No signup, free, fully private.",
  },
  "javascript-minifier": {
    title: "JavaScript Minifier Online Free — Minify JS Code",
    description:
      "JavaScript minifier online free: minify JavaScript client-side in your browser for smaller files and faster loads. No signup, free, fully private.",
  },
  "sql-formatter": {
    title: "SQL Formatter Online Free — Format SQL Queries",
    description:
      "SQL formatter online free: format SQL with readable structure in your browser. Make queries easy to read. No signup, free, private.",
  },
  "base64-encoder": {
    title: "Base64 Encoder Online Free — Encode Text & Files",
    description:
      "Base64 encoder online free: encode text or files to Base64 safely in your browser, with no server uploads. No signup, free, instant results, private.",
  },
  "base64-decoder": {
    title: "Base64 Decoder Online Free — Decode Base64 Data",
    description:
      "Base64 decoder online free: decode Base64 into readable text or downloadable files in your browser. No signup, free, instant results, fully private.",
  },
  "url-encoder": {
    title: "URL Encoder Online Free — Encode URL Characters",
    description:
      "URL encoder online free: encode unsafe URL characters in your browser for safe links, queries, and sharing. No signup, free, instant results.",
  },
  "url-decoder": {
    title: "URL Decoder Online Free — Decode Encoded URLs",
    description:
      "URL decoder online free: decode encoded URL strings back to readable text in your browser, including percent-encoded characters. No signup, free, instant.",
  },
  "jwt-decoder": {
    title: "JWT Decoder Online Free — Decode JWT Tokens Locally",
    description:
      "JWT decoder online free: decode JWT header and payload locally in your browser to inspect claims and expiry. Tokens never leave your device. No signup, free.",
  },
  "uuid-generator": {
    title: "UUID Generator Online Free — Bulk UUIDs in Seconds",
    description:
      "UUID generator online free: generate UUIDs in bulk for development, testing, and databases in your browser. No signup, free, instant results, private.",
  },
  "hash-generator": {
    title: "Hash Generator Online Free — Hash Text & Files",
    description:
      "Hash generator online free: generate hashes for text or files in your browser, with several algorithms to choose from. No signup, free, instant, private.",
  },
  "md5-generator": {
    title: "MD5 Generator Online Free — Generate MD5 Hashes",
    description:
      "MD5 generator online free: generate an MD5 hash for any text instantly in your browser, with results copied in one click. No signup, free, fully private.",
  },
  "sha256-generator": {
    title: "SHA-256 Generator Online Free — Generate SHA-256 Hash",
    description:
      "SHA-256 generator online free: generate a SHA-256 hash for text in your browser for checksums and verification. No signup, free, instant, fully private.",
  },
  "meta-tag-generator": {
    title: "Meta Tag Generator Online Free — SEO Meta Tags",
    description:
      "Meta tag generator online free: generate title, meta, Open Graph, and Twitter tags for your pages. No signup, free, instant, browser-based.",
  },
  "robots-txt-generator": {
    title: "Robots.txt Generator Online Free — Build Robots.txt",
    description:
      "Robots.txt generator online free: build a clean robots.txt file for your site with allow and disallow rules in your browser. No signup, free, instant.",
  },
  "sitemap-generator": {
    title: "Sitemap Generator Online Free — Generate XML Sitemaps",
    description:
      "Sitemap generator online free: generate an XML sitemap from URLs or a crawl to help search engines find your pages. No signup, free, browser-based.",
  },
  "keyword-density-checker": {
    title: "Keyword Density Checker Online Free — SEO Keywords",
    description:
      "Keyword density checker online free: measure keyword density in text or URLs for SEO. No signup, free, instant results in your browser.",
  },
  "serp-preview-tool": {
    title: "SERP Preview Tool Online Free — Google SERP Preview",
    description:
      "SERP preview tool online free: preview how titles and descriptions look in Google search results. No signup, free, instant, browser-based.",
  },
  "open-graph-generator": {
    title: "Open Graph Generator Online Free — Social OG Tags",
    description:
      "Open Graph generator online free: generate social meta tags and preview cards for sharing. No signup, free, instant, browser-based.",
  },
  "canonical-tag-generator": {
    title: "Canonical Tag Generator Online Free — Canonical URLs",
    description:
      "Canonical tag generator online free: generate canonical link tags to avoid duplicate content issues and consolidate ranking signals. No signup, free, instant.",
  },
  "schema-markup-generator": {
    title: "Schema Markup Generator Online Free — JSON-LD Schema",
    description:
      "Schema markup generator online free: generate JSON-LD markup for common schema types to enrich search results. No signup, free, instant, browser-based.",
  },
  "website-speed-test": {
    title: "Website Speed Test Online Free — Check Site Speed",
    description:
      "Website speed test online free: check timing and speed metrics for any URL, including load and response times. No signup, free, instant results.",
  },
  "broken-link-checker": {
    title: "Broken Link Checker Online Free — Find Broken Links",
    description:
      "Broken link checker online free: crawl a page and report broken links to fix, keeping your site healthy for visitors and search. No signup, free, instant.",
  },
  "password-strength-checker": {
    title: "Password Strength Checker Online Free — Test Password",
    description:
      "Password strength checker online free: estimate password strength and entropy locally in your browser. Passwords never leave your device. Free.",
  },
  "whois-lookup": {
    title: "WHOIS Lookup Online Free — Domain Registration Info",
    description:
      "WHOIS lookup online free: look up domain registration details, including registrar and expiry, for any domain. No signup, free, instant results.",
  },
  "dns-lookup": {
    title: "DNS Lookup Online Free — Check DNS Records Fast",
    description:
      "DNS lookup online free: query DNS records for a domain instantly, including A, MX, TXT, and nameserver records. No signup, free, browser-based.",
  },
  "ip-lookup": {
    title: "IP Lookup Online Free — IP Location & Network Info",
    description:
      "IP lookup online free: inspect IP geolocation and network information for any address, including ISP and location. No signup, free, instant results.",
  },
  "email-validator": {
    title: "Email Validator Online Free — Validate Email Addresses",
    description:
      "Email validator online free: validate email syntax and mail records for any address. No signup, free, instant results in your browser.",
  },
  "length-converter": {
    title: "Length Converter Online Free — Meters, Feet & Miles",
    description:
      "Length converter online free: convert meters, feet, miles, centimeters, and more instantly in your browser. No signup, free, accurate results.",
  },
  "weight-converter": {
    title: "Weight Converter Online Free — Kg, Pounds & Grams",
    description:
      "Weight converter online free: convert kilograms, pounds, grams, ounces, and more instantly in your browser. No signup, free, accurate results.",
  },
  "area-converter": {
    title: "Area Converter Online Free — Acres, Hectares & More",
    description:
      "Area converter online free: convert square units, acres, hectares, and square feet instantly in your browser. No signup, free, accurate results.",
  },
  "temperature-converter": {
    title: "Temperature Converter Online Free — Celsius & Fahrenheit",
    description:
      "Temperature converter online free: convert Celsius, Fahrenheit, and Kelvin instantly with precise results. No signup, free, runs in your browser.",
  },
  "time-zone-converter": {
    title: "Time Zone Converter Online Free — Convert World Time",
    description:
      "Time zone converter online free: convert time across global zones instantly, with daylight saving handled for you. No signup, free, accurate results.",
  },
  "data-storage-converter": {
    title: "Data Storage Converter Online Free — Bits & Bytes",
    description:
      "Data storage converter online free: convert bits, bytes, kilobytes, megabytes, and gigabytes instantly. No signup, free, runs in your browser.",
  },
  "binary-converter": {
    title: "Binary Converter Online Free — Text, Hex & Decimal",
    description:
      "Binary converter online free: convert between text, binary, hex, and decimal instantly, for learning and debugging. No signup, free, browser-based.",
  },
  "roman-numeral-converter": {
    title: "Roman Numeral Converter Online Free — Numbers to Roman",
    description:
      "Roman numeral converter online free: convert numbers to and from Roman numerals instantly, for dates, chapters, and clocks. No signup, free.",
  },
  "age-calculator": {
    title: "Age Calculator Online Free — Calculate Your Exact Age",
    description:
      "Age calculator online free: calculate age in years, months, and days from any birth date, plus next birthday. No signup, free, instant results.",
  },
  "bmi-calculator": {
    title: "BMI Calculator Online Free — Body Mass Index Check",
    description:
      "BMI calculator online free: calculate body mass index and category instantly. Informational estimates only, not medical advice. Free, no signup.",
  },
  "percentage-calculator": {
    title: "Percentage Calculator Online Free — Solve Percentages",
    description:
      "Percentage calculator online free: solve common percentage calculations instantly in your browser. No signup, free, accurate results.",
  },
  "gst-calculator": {
    title: "GST Calculator Online Free — Add or Remove GST",
    description:
      "GST calculator online free: add or remove GST from a price instantly, with the tax amount shown separately. Planning estimates only, not tax advice. Free.",
  },
  "vat-calculator": {
    title: "VAT Calculator Online Free — Add or Remove VAT",
    description:
      "VAT calculator online free: add or remove VAT from a price instantly, with the tax amount shown separately. Planning estimates only, not tax advice. Free.",
  },
  "discount-calculator": {
    title: "Discount Calculator Online Free — Savings & Sale Price",
    description:
      "Discount calculator online free: calculate discounts, savings, and final sale prices instantly. No signup, free, runs in your browser.",
  },
  "profit-calculator": {
    title: "Profit Calculator Online Free — Margin & Markup",
    description:
      "Profit calculator online free: calculate profit, margin, and markup for pricing instantly. Planning estimates only. Free, no signup.",
  },
  "scientific-calculator": {
    title: "Scientific Calculator Online Free — Advanced Math",
    description:
      "Scientific calculator online free: handle everyday and scientific math in your browser, from arithmetic to trigonometry. No signup, free, instant results.",
  },
  "date-calculator": {
    title: "Date Calculator Online Free — Add & Compare Dates",
    description:
      "Date calculator online free: add, subtract, and compare dates instantly in your browser, including days between dates. No signup, free, accurate.",
  },
  "tip-calculator": {
    title: "Tip Calculator Online Free — Split Bills & Tips",
    description:
      "Tip calculator online free: split bills and calculate tips instantly in your browser, per person or for the whole table. No signup, free, accurate.",
  },
  "margin-calculator": {
    title: "Margin Calculator Online Free — Pricing & Markup",
    description:
      "Margin calculator online free: solve pricing with margin and markup instantly. Planning estimates only, not financial advice. Free, no signup.",
  },
  "barcode-generator": {
    title: "Barcode Generator Online Free — Create Barcodes",
    description:
      "Barcode generator online free: generate barcodes in common formats in your browser. Download instantly. No signup, free, fully private.",
  },
  "color-picker": {
    title: "Color Picker Online Free — Pick & Copy Colors",
    description:
      "Color picker online free: pick colors and copy multiple color formats instantly in your browser, including HEX and RGB. No signup, free, simple to use.",
  },
  "color-converter": {
    title: "Color Converter Online Free — HEX, RGB, HSL & CMYK",
    description:
      "Color converter online free: convert HEX, RGB, HSL, HSV, and CMYK colors instantly in your browser for design work. No signup, free, accurate.",
  },
  "uuid-generator-util": {
    title: "UUID Generator Online Free — Simple UUID Creator",
    description:
      "UUID generator online free: generate UUIDs with a simpler utility interface in your browser, one at a time or in bulk. No signup, free, instant results.",
  },
  "random-number-generator": {
    title: "Random Number Generator Online Free — Pick Numbers",
    description:
      "Random number generator online free: generate random numbers in any range in your browser, with or without repeats. No signup, free, instant results.",
  },
  "random-password-generator": {
    title: "Random Password Generator Online Free — Quick Passwords",
    description:
      "Random password generator online free: generate passwords from simple utility controls locally. Passwords never leave your device. Free.",
  },
  "timestamp-converter": {
    title: "Timestamp Converter Online Free — Dates & Unix Time",
    description:
      "Timestamp converter online free: convert dates and Unix timestamps instantly in your browser, in both directions. No signup, free, accurate results.",
  },
  "unix-time-converter": {
    title: "Unix Time Converter Online Free — Unix to Readable Date",
    description:
      "Unix time converter online free: convert Unix time into readable dates instantly in your browser, and back again. No signup, free, accurate results.",
  },
  "coin-flipper": {
    title: "Coin Flipper Online Free — Flip a Virtual Coin",
    description:
      "Coin flipper online free: flip a virtual coin and track heads and tails streaks in your browser. A fair, instant random result every time. No signup, free.",
  },
  "dice-roller": {
    title: "Dice Roller Online Free — Roll Dice with History",
    description:
      "Dice roller online free: roll one or more dice with roll history in your browser, for games and decisions. No signup, free, instant results, simple.",
  },
  "stopwatch": {
    title: "Stopwatch Online Free — Track Time with Laps",
    description:
      "Stopwatch online free: track elapsed time with laps in your browser, with a clean display and lap history. No signup, free, accurate, simple to use.",
  },
  "timer": {
    title: "Timer Online Free — Countdown Timer with Alerts",
    description:
      "Timer online free: run countdown timers with alerts in your browser for cooking, workouts, study, and work sessions. No signup, free, simple, reliable.",
  },
  "notepad-online": {
    title: "Notepad Online Free — Write Notes in Your Browser",
    description:
      "Notepad online free: write notes and save them locally in your browser, with autosave to your device. Notes stay private on your device. No signup, free.",
  },
  "todo-list-online": {
    title: "Todo List Online Free — Manage Tasks Locally",
    description:
      "Todo list online free: manage simple tasks saved in local storage in your browser, with check-off and delete. No signup, free, tasks stay on your device.",
  },
};

export function buildToolMetadata(tool: Tool): Metadata {
  const override = seoOverrides[tool.id];
  const title = override
    ? { absolute: `${override.title} | ${siteName}` }
    : { absolute: `${tool.name} — Free Online Tool | ${siteName}` };
  const description = override
    ? override.description
    : tool.runtime === "client"
      ? `${tool.blurb} Free, no signup, files never leave your device.`
      : `${tool.blurb} Free, no signup, works in your browser.`;
  const path = `/tools/${tool.id}`;
  const ogTitle = override ? override.title : `${tool.name} — Free Online Tool`;
  const ogImage = ogImageUrl(
    tool.name,
    tool.blurb,
    `${categoryMeta[tool.category].name} tools`,
  );

  return {
    robots: { index: isToolIndexable(tool), follow: true },
    title,
    description,
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
    openGraph: {
      title: ogTitle,
      description,
      type: "website",
      url: path,
      locale: "en_US",
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImage],
    },
  };
}

const categorySeo: Partial<Record<Category, { title: string; description: string }>> = {
  pdf: {
    title: "Free PDF Tools Online — Merge, Split, Compress & Convert PDF",
    description:
      "Free PDF tools online: merge, split, compress, convert, edit, sign, and protect PDFs in your browser. No signup, no watermark, files stay private.",
  },
  image: {
    title: "Free Image Tools Online — Compress, Resize, Convert & Edit",
    description:
      "Free image tools online: compress, resize, crop, rotate, and convert JPG, PNG, WebP, and HEIC images in your browser. No signup, no watermark.",
  },
  ai: {
    title: "Free AI Tools Online — Detector, Paraphraser, Summarizer & More",
    description:
      "Free AI tools online: detect AI writing, paraphrase, summarize, rewrite, translate, and draft emails. No signup. AI features need a configured provider.",
  },
  text: {
    title: "Free Text Tools Online — Counters, Converters & Cleaners",
    description:
      "Free text tools online: count words and characters, convert case, sort and clean text, and generate placeholder copy. No signup, runs in your browser.",
  },
  developer: {
    title: "Free Developer Tools Online — Formatters, Validators & Encoders",
    description:
      "Free developer tools online: format and validate JSON, XML, HTML, and SQL, minify code, encode Base64 and URLs, decode JWTs, and hash text. No signup.",
  },
  seo: {
    title: "Free SEO Tools Online — Meta Tags, Sitemaps, SERP & Schema",
    description:
      "Free SEO tools online: generate meta tags, robots.txt, sitemaps, and schema markup, preview SERP listings, and check links and speed. No signup.",
  },
  security: {
    title: "Free Security Tools Online — Passwords, SSL, DNS & WHOIS",
    description:
      "Free security tools online: generate strong passwords, check password strength, and inspect SSL certificates, DNS records, WHOIS, and IP data. No signup.",
  },
  converters: {
    title: "Free Converter Tools Online — Currency, Units, Time & More",
    description:
      "Free converter tools online: convert currency, length, weight, area, temperature, time zones, data storage, binary, and Roman numerals. No signup.",
  },
  calculators: {
    title: "Free Calculator Tools Online — Loans, Mortgage, BMI & ROI",
    description:
      "Free calculator tools online: mortgage, loan, EMI, BMI, GST, VAT, ROI, profit, and tip calculators. Planning estimates, not financial advice. No signup.",
  },
  utilities: {
    title: "Free Utility Tools Online — QR Codes, Colors, Timers & Notes",
    description:
      "Free utility tools online: generate QR codes and barcodes, pick and convert colors, flip coins, roll dice, run timers, and keep notes. No signup.",
  },
};

export function buildCategoryMetadata(category: Category): Metadata {
  const meta = categoryMeta[category];
  const seo = categorySeo[category];
  const title = seo ? seo.title : `${meta.name} Tools`;
  const description = seo ? seo.description : meta.description;
  const path = `/category/${category}`;
  const ogImage = ogImageUrl(
    `${meta.name} Tools`,
    meta.description,
    "Browse by category",
  );

  return {
    title: { absolute: `${title} | ${siteName}` },
    description,
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
      locale: "en_US",
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function buildBlogMetadata(post: BlogPost): Metadata {
  const path = `/blog/${post.slug}`;
  // Tool posts keep the exact previous OG subtitle/tag. Editorial posts
  // (no toolId) use a category guide subtitle instead; hreflang, OG tags,
  // and canonicals below are unchanged for both kinds.
  const ogImage = ogImageUrl(
    post.seoTitle,
    post.toolId
      ? `How to use ${post.toolName} online, free`
      : `${categoryMeta[post.category].name} guide`,
    post.toolId ? "Tool guide" : "Editorial guide",
  );

  return {
    robots: { index: true, follow: true },
    title: { absolute: `${post.seoTitle} | ${siteName}` },
    description: post.seoDescription,
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      type: "article",
      url: path,
      locale: "en_US",
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.seoTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle,
      description: post.seoDescription,
      images: [ogImage],
    },
  };
}
