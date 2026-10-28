# Tool inventory

Discovered **137** unique registry tools: **137** wired and **0** placeholders; **0** orphan dispatcher IDs.

Generated with `node --import tsx scripts/generate-tool-inventory.ts`. Source: imported `lib/tools.ts`, TypeScript AST of `tools/index.tsx`, and transitive local imports. Re-running does not infer successful operations from component presence. Source fingerprints invalidate retained functional evidence when tracked code changes.

The machine-readable [test matrix](tool-test-matrix.json) contains dependencies, external requirements, conservative processing strategy, known limitations, test dimensions, admin support and source fingerprints for every tool. Shared-module dependency graphs may include dependencies used by sibling tools. Runtime is internal registry configuration, not a visitor execution choice.

BLOCKED means meaningful functional verification is pending; external requirements are separately recorded. NOT IMPLEMENTED means a placeholder or an explicitly missing advertised capability. No operational PASS has been inferred from prior audit maturity labels.

All rows currently have shared admin visibility/page-open counting only. Persistence requires MongoDB; configurable limits, maintenance, execution metrics and audit history remain pending. SEO metadata exists at the shared route but indexing/rendering is unverified. Resource usage has not been measured.

| ID | Name | Category | URL | Component | Implementation | API | Processing | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|
| pdf-to-word | PDF to Word | pdf | /tools/pdf-to-word | OfficeConverterTool | tools/office/OfficeTools.tsx | — | CLIENT | PASS | P1 |
| word-to-pdf | Word to PDF | pdf | /tools/word-to-pdf | OfficeConverterTool | tools/office/OfficeTools.tsx | — | CLIENT | PASS | P1 |
| pdf-to-excel | PDF to Excel | pdf | /tools/pdf-to-excel | OfficeConverterTool | tools/office/OfficeTools.tsx | — | CLIENT | PASS | P1 |
| excel-to-pdf | Excel to PDF | pdf | /tools/excel-to-pdf | OfficeConverterTool | tools/office/OfficeTools.tsx | — | CLIENT | PASS | P1 |
| pdf-to-powerpoint | PDF to PowerPoint | pdf | /tools/pdf-to-powerpoint | OfficeConverterTool | tools/office/OfficeTools.tsx | — | CLIENT | PASS | P1 |
| powerpoint-to-pdf | PowerPoint to PDF | pdf | /tools/powerpoint-to-pdf | OfficeConverterTool | tools/office/OfficeTools.tsx | — | CLIENT | PASS | P1 |
| pdf-to-jpg | PDF to JPG | pdf | /tools/pdf-to-jpg | PdfToImageTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| jpg-to-pdf | JPG to PDF | pdf | /tools/jpg-to-pdf | ImageToPdfTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| png-to-pdf | PNG to PDF | pdf | /tools/png-to-pdf | ImageToPdfTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| pdf-to-png | PDF to PNG | pdf | /tools/pdf-to-png | PdfToImageTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| merge-pdf | Merge PDF | pdf | /tools/merge-pdf | MergePdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| split-pdf | Split PDF | pdf | /tools/split-pdf | SplitPdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| compress-pdf | Compress PDF | pdf | /tools/compress-pdf | CompressPdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| rotate-pdf | Rotate PDF | pdf | /tools/rotate-pdf | RotatePdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| unlock-pdf | Unlock PDF | pdf | /tools/unlock-pdf | UnlockPdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| protect-pdf | Protect PDF | pdf | /tools/protect-pdf | ProtectPdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| edit-pdf | Edit PDF | pdf | /tools/edit-pdf | EditPdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| ocr-pdf | OCR PDF | pdf | /tools/ocr-pdf | OcrPdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| sign-pdf | Sign PDF | pdf | /tools/sign-pdf | SignPdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| watermark-pdf | Watermark PDF | pdf | /tools/watermark-pdf | WatermarkPdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| delete-pdf-pages | Delete PDF Pages | pdf | /tools/delete-pdf-pages | DeletePdfPagesTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| rearrange-pdf-pages | Rearrange PDF Pages | pdf | /tools/rearrange-pdf-pages | RearrangePdfTool | tools/pdf/PdfTools.tsx | — | CLIENT | PASS | P1 |
| image-compressor | Image Compressor | image | /tools/image-compressor | ImageCompressorTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| image-resizer | Image Resizer | image | /tools/image-resizer | ImageResizerTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| crop-image | Crop Image | image | /tools/crop-image | CropImageTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| rotate-image | Rotate Image | image | /tools/rotate-image | RotateImageTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| convert-image | Convert Image | image | /tools/convert-image | ImageConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| jpg-to-png | JPG to PNG | image | /tools/jpg-to-png | ImageConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| png-to-jpg | PNG to JPG | image | /tools/png-to-jpg | ImageConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| webp-converter | WebP Converter | image | /tools/webp-converter | ImageConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| webp-to-jpg | WebP to JPG | image | /tools/webp-to-jpg | ImageConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| webp-to-png | WebP to PNG | image | /tools/webp-to-png | ImageConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| jfif-to-png | JFIF to PNG | image | /tools/jfif-to-png | ImageConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| jpeg-to-jpg | JPEG to JPG | image | /tools/jpeg-to-jpg | ImageConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| heic-to-jpg | HEIC to JPG | image | /tools/heic-to-jpg | ImageConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| svg-converter | SVG Converter | image | /tools/svg-converter | SvgConverterTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| background-remover | Background Remover | image | /tools/background-remover | BackgroundRemoverTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| image-upscaler | Image Upscaler | image | /tools/image-upscaler | ImageUpscalerTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| image-to-pdf | Image to PDF | image | /tools/image-to-pdf | ImageToPdfTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| screenshot-tool | Screenshot Tool | image | /tools/screenshot-tool | ScreenshotTool | tools/image/ImageTools.tsx | — | CLIENT | PASS | P1 |
| ai-detector | AI Detector | ai | /tools/ai-detector | AiDetectorTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| plagiarism-checker | Plagiarism Checker | ai | /tools/plagiarism-checker | PlagiarismCheckerTool | tools/ai/PlagiarismTool.tsx | /api/plagiarism | EXTERNAL_API | BLOCKED | P1 |
| grammar-checker | Grammar Checker | ai | /tools/grammar-checker | AiGrammarTranslatorTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| spell-checker | Spell Checker | ai | /tools/spell-checker | AiGrammarTranslatorTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| paraphrasing-tool | Paraphrasing Tool | ai | /tools/paraphrasing-tool | AiWriterTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| article-rewriter | Article Rewriter | ai | /tools/article-rewriter | AiWriterTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| ai-summarizer | AI Summarizer | ai | /tools/ai-summarizer | AiWriterTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| ai-writer | AI Writer | ai | /tools/ai-writer | AiWriterTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| ai-humanizer | AI Humanizer | ai | /tools/ai-humanizer | AiWriterTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| ai-translator | AI Translator | ai | /tools/ai-translator | AiGrammarTranslatorTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| ai-email-writer | AI Email Writer | ai | /tools/ai-email-writer | AiWriterTool | tools/ai/AiTools.tsx | /api/ai | EXTERNAL_API | BLOCKED | P1 |
| case-converter | Case Converter | text | /tools/case-converter | CaseConverterTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| word-counter | Word Counter | text | /tools/word-counter | WordCounterTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| character-counter | Character Counter | text | /tools/character-counter | CharacterCounterTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| sentence-counter | Sentence Counter | text | /tools/sentence-counter | SentenceCounterTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| remove-duplicate-lines | Remove Duplicate Lines | text | /tools/remove-duplicate-lines | RemoveDuplicateLinesTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| text-sorter | Text Sorter | text | /tools/text-sorter | TextSorterTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| text-cleaner | Text Cleaner | text | /tools/text-cleaner | TextCleanerTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| lorem-ipsum-generator | Lorem Ipsum Generator | text | /tools/lorem-ipsum-generator | LoremIpsumGeneratorTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| random-text-generator | Random Text Generator | text | /tools/random-text-generator | RandomTextGeneratorTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| remove-extra-spaces | Remove Extra Spaces | text | /tools/remove-extra-spaces | RemoveExtraSpacesTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| reverse-text | Reverse Text | text | /tools/reverse-text | ReverseTextTool | tools/text/TextTools.tsx | — | CLIENT | PASS | P2 |
| json-formatter | JSON Formatter | developer | /tools/json-formatter | JsonFormatterTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| json-validator | JSON Validator | developer | /tools/json-validator | JsonValidatorTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| json-minifier | JSON Minifier | developer | /tools/json-minifier | JsonMinifierTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| xml-formatter | XML Formatter | developer | /tools/xml-formatter | AdditionalDeveloperTool | tools/developer/AdditionalDeveloperTools.tsx | — | CLIENT | PASS | P2 |
| xml-validator | XML Validator | developer | /tools/xml-validator | AdditionalDeveloperTool | tools/developer/AdditionalDeveloperTools.tsx | — | CLIENT | PASS | P2 |
| html-formatter | HTML Formatter | developer | /tools/html-formatter | AdditionalDeveloperTool | tools/developer/AdditionalDeveloperTools.tsx | — | CLIENT | PASS | P2 |
| html-minifier | HTML Minifier | developer | /tools/html-minifier | AdditionalDeveloperTool | tools/developer/AdditionalDeveloperTools.tsx | — | CLIENT | PASS | P2 |
| css-minifier | CSS Minifier | developer | /tools/css-minifier | AdditionalDeveloperTool | tools/developer/AdditionalDeveloperTools.tsx | — | CLIENT | PASS | P2 |
| javascript-minifier | JavaScript Minifier | developer | /tools/javascript-minifier | AdditionalDeveloperTool | tools/developer/AdditionalDeveloperTools.tsx | — | CLIENT | PASS | P2 |
| sql-formatter | SQL Formatter | developer | /tools/sql-formatter | AdditionalDeveloperTool | tools/developer/AdditionalDeveloperTools.tsx | — | CLIENT | PASS | P2 |
| base64-encoder | Base64 Encoder | developer | /tools/base64-encoder | Base64EncoderTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| base64-decoder | Base64 Decoder | developer | /tools/base64-decoder | Base64DecoderTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| url-encoder | URL Encoder | developer | /tools/url-encoder | UrlEncoderTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| url-decoder | URL Decoder | developer | /tools/url-decoder | UrlDecoderTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| jwt-decoder | JWT Decoder | developer | /tools/jwt-decoder | JwtDecoderTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| uuid-generator | UUID Generator | developer | /tools/uuid-generator | UuidGeneratorTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| hash-generator | Hash Generator | developer | /tools/hash-generator | HashGeneratorTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| md5-generator | MD5 Generator | developer | /tools/md5-generator | HashGeneratorTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| sha256-generator | SHA-256 Generator | developer | /tools/sha256-generator | HashGeneratorTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| meta-tag-generator | Meta Tag Generator | seo | /tools/meta-tag-generator | MetaTagGeneratorTool | tools/seo/SeoTools.tsx | — | CLIENT | PASS | P1 |
| robots-txt-generator | Robots.txt Generator | seo | /tools/robots-txt-generator | RobotsTxtGeneratorTool | tools/seo/SeoTools.tsx | — | CLIENT | PASS | P1 |
| sitemap-generator | Sitemap Generator | seo | /tools/sitemap-generator | SitemapGeneratorTool | tools/seo/SeoTools.tsx | — | SERVER | PASS | P1 |
| keyword-density-checker | Keyword Density Checker | seo | /tools/keyword-density-checker | KeywordDensityCheckerTool | tools/seo/SeoTools.tsx | — | SERVER | PASS | P1 |
| serp-preview-tool | SERP Preview Tool | seo | /tools/serp-preview-tool | SerpPreviewTool | tools/seo/SeoTools.tsx | — | CLIENT | PASS | P1 |
| open-graph-generator | Open Graph Generator | seo | /tools/open-graph-generator | OpenGraphGeneratorTool | tools/seo/SeoTools.tsx | — | CLIENT | PASS | P1 |
| canonical-tag-generator | Canonical Tag Generator | seo | /tools/canonical-tag-generator | CanonicalTagGeneratorTool | tools/seo/SeoTools.tsx | — | CLIENT | PASS | P1 |
| schema-markup-generator | Schema Markup Generator | seo | /tools/schema-markup-generator | SchemaMarkupGeneratorTool | tools/seo/SeoTools.tsx | — | CLIENT | PASS | P1 |
| website-speed-test | Website Speed Test | seo | /tools/website-speed-test | WebsiteSpeedTestTool | tools/server/ServerTools.tsx | /api/crawl | SERVER | PASS | P1 |
| broken-link-checker | Broken Link Checker | seo | /tools/broken-link-checker | BrokenLinkCheckerTool | tools/server/ServerTools.tsx | /api/crawl?mode=links | SERVER | PASS | P1 |
| password-generator | Password Generator | security | /tools/password-generator | PasswordGeneratorTool | tools/utilities/UtilityTools.tsx | — | CLIENT | PASS | P1 |
| password-strength-checker | Password Strength Checker | security | /tools/password-strength-checker | PasswordStrengthCheckerTool | tools/utilities/AdditionalUtilities.tsx | — | CLIENT | PASS | P1 |
| ssl-checker | SSL Checker | security | /tools/ssl-checker | SslCheckerTool | tools/server/ServerTools.tsx | /api/ssl | SERVER | PASS | P1 |
| whois-lookup | WHOIS Lookup | security | /tools/whois-lookup | WhoisLookupTool | tools/server/ServerTools.tsx | /api/whois | SERVER | PASS | P1 |
| dns-lookup | DNS Lookup | security | /tools/dns-lookup | DnsLookupTool | tools/server/ServerTools.tsx | /api/dns | SERVER | PASS | P1 |
| ip-lookup | IP Lookup | security | /tools/ip-lookup | IpLookupTool | tools/server/ServerTools.tsx | /api/ip | SERVER | PASS | P1 |
| email-validator | Email Validator | security | /tools/email-validator | EmailValidatorTool | tools/server/ServerTools.tsx | /api/email-check | SERVER | PASS | P1 |
| currency-converter | Currency Converter | converters | /tools/currency-converter | CurrencyConverterServerTool | tools/server/ServerTools.tsx | /api/rates | SERVER | PASS | P2 |
| length-converter | Length Converter | converters | /tools/length-converter | LengthConverterTool | tools/converters/ConverterTools.tsx | — | CLIENT | PASS | P2 |
| weight-converter | Weight Converter | converters | /tools/weight-converter | WeightConverterTool | tools/converters/ConverterTools.tsx | — | CLIENT | PASS | P2 |
| area-converter | Area Converter | converters | /tools/area-converter | AreaConverterTool | tools/converters/AdditionalConverters.tsx | — | CLIENT | PASS | P2 |
| temperature-converter | Temperature Converter | converters | /tools/temperature-converter | TemperatureConverterTool | tools/converters/ConverterTools.tsx | — | CLIENT | PASS | P2 |
| time-zone-converter | Time Zone Converter | converters | /tools/time-zone-converter | TimeZoneConverterTool | tools/converters/AdditionalConverters.tsx | — | CLIENT | PASS | P2 |
| data-storage-converter | Data Storage Converter | converters | /tools/data-storage-converter | DataStorageConverterTool | tools/converters/AdditionalConverters.tsx | — | CLIENT | PASS | P2 |
| binary-converter | Binary Converter | converters | /tools/binary-converter | BinaryConverterTool | tools/converters/ConverterTools.tsx | — | CLIENT | PASS | P2 |
| roman-numeral-converter | Roman Numeral Converter | converters | /tools/roman-numeral-converter | RomanNumeralConverterTool | tools/converters/ConverterTools.tsx | — | CLIENT | PASS | P2 |
| age-calculator | Age Calculator | calculators | /tools/age-calculator | AgeCalculatorTool | tools/calculators/CalculatorTools.tsx | — | CLIENT | PASS | P2 |
| bmi-calculator | BMI Calculator | calculators | /tools/bmi-calculator | BmiCalculatorTool | tools/calculators/CalculatorTools.tsx | — | CLIENT | PASS | P2 |
| percentage-calculator | Percentage Calculator | calculators | /tools/percentage-calculator | PercentageCalculatorTool | tools/calculators/CalculatorTools.tsx | — | CLIENT | PASS | P2 |
| emi-calculator | EMI Calculator | calculators | /tools/emi-calculator | EmiCalculatorTool | tools/calculators/CalculatorTools.tsx | — | CLIENT | PASS | P2 |
| loan-calculator | Loan Calculator | calculators | /tools/loan-calculator | EmiCalculatorTool | tools/calculators/CalculatorTools.tsx | — | CLIENT | PASS | P2 |
| gst-calculator | GST Calculator | calculators | /tools/gst-calculator | GstCalculatorTool | tools/calculators/CalculatorTools.tsx | — | CLIENT | PASS | P2 |
| vat-calculator | VAT Calculator | calculators | /tools/vat-calculator | GstCalculatorTool | tools/calculators/CalculatorTools.tsx | — | CLIENT | PASS | P2 |
| discount-calculator | Discount Calculator | calculators | /tools/discount-calculator | DiscountCalculatorTool | tools/calculators/AdditionalCalculators.tsx | — | CLIENT | PASS | P2 |
| profit-calculator | Profit Calculator | calculators | /tools/profit-calculator | ProfitCalculatorTool | tools/calculators/AdditionalCalculators.tsx | — | CLIENT | PASS | P2 |
| scientific-calculator | Scientific Calculator | calculators | /tools/scientific-calculator | ScientificCalculatorTool | tools/calculators/AdditionalCalculators.tsx | — | CLIENT | PASS | P2 |
| date-calculator | Date Calculator | calculators | /tools/date-calculator | DateCalculatorTool | tools/calculators/AdditionalCalculators.tsx | — | CLIENT | PASS | P2 |
| mortgage-calculator | Mortgage Calculator | calculators | /tools/mortgage-calculator | MortgageCalculatorTool | tools/calculators/AdditionalCalculators.tsx | — | CLIENT | PASS | P2 |
| roi-calculator | ROI Calculator | calculators | /tools/roi-calculator | RoiCalculatorTool | tools/calculators/AdditionalCalculators.tsx | — | CLIENT | PASS | P2 |
| tip-calculator | Tip Calculator | calculators | /tools/tip-calculator | TipCalculatorTool | tools/calculators/AdditionalCalculators.tsx | — | CLIENT | PASS | P2 |
| margin-calculator | Margin Calculator | calculators | /tools/margin-calculator | MarginCalculatorTool | tools/calculators/AdditionalCalculators.tsx | — | CLIENT | PASS | P2 |
| qr-code-generator | QR Code Generator | utilities | /tools/qr-code-generator | QrCodeGeneratorTool | tools/utilities/UtilityTools.tsx | — | CLIENT | PASS | P2 |
| barcode-generator | Barcode Generator | utilities | /tools/barcode-generator | BarcodeGeneratorTool | tools/utilities/UtilityTools.tsx | — | CLIENT | PASS | P2 |
| color-picker | Color Picker | utilities | /tools/color-picker | ColorPickerTool | tools/utilities/UtilityTools.tsx | — | CLIENT | PASS | P2 |
| color-converter | Color Converter | utilities | /tools/color-converter | ColorPickerTool | tools/utilities/UtilityTools.tsx | — | CLIENT | PASS | P2 |
| uuid-generator-util | UUID Generator | utilities | /tools/uuid-generator-util | UuidGeneratorTool | tools/developer/DeveloperTools.tsx | — | CLIENT | PASS | P2 |
| random-number-generator | Random Number Generator | utilities | /tools/random-number-generator | RandomNumberGeneratorTool | tools/utilities/AdditionalUtilities.tsx | — | CLIENT | PASS | P2 |
| random-password-generator | Random Password Generator | utilities | /tools/random-password-generator | PasswordGeneratorTool | tools/utilities/UtilityTools.tsx | — | CLIENT | PASS | P2 |
| timestamp-converter | Timestamp Converter | utilities | /tools/timestamp-converter | TimestampConverterTool | tools/utilities/AdditionalUtilities.tsx | — | CLIENT | PASS | P2 |
| unix-time-converter | Unix Time Converter | utilities | /tools/unix-time-converter | UnixTimeConverterTool | tools/utilities/AdditionalUtilities.tsx | — | CLIENT | PASS | P2 |
| coin-flipper | Coin Flipper | utilities | /tools/coin-flipper | CoinFlipperTool | tools/utilities/UtilityTools.tsx | — | CLIENT | PASS | P2 |
| dice-roller | Dice Roller | utilities | /tools/dice-roller | DiceRollerTool | tools/utilities/AdditionalUtilities.tsx | — | CLIENT | PASS | P2 |
| stopwatch | Stopwatch | utilities | /tools/stopwatch | StopwatchTool | tools/utilities/AdditionalUtilities.tsx | — | CLIENT | PASS | P2 |
| timer | Timer | utilities | /tools/timer | TimerTool | tools/utilities/AdditionalUtilities.tsx | — | CLIENT | PASS | P2 |
| notepad-online | Notepad Online | utilities | /tools/notepad-online | NotepadOnlineTool | tools/utilities/UtilityTools.tsx | — | CLIENT | PASS | P2 |
| todo-list-online | Todo List Online | utilities | /tools/todo-list-online | TodoListOnlineTool | tools/utilities/AdditionalUtilities.tsx | — | CLIENT | PASS | P2 |
