"use client";

import React, { useSyncExternalStore } from "react";
import type { Tool } from "@/lib/tools";
import { ToolPlaceholder } from "@/tools/_shared/tool-placeholder";

// PDF Tools
import {
  MergePdfTool,
  SplitPdfTool,
  DeletePdfPagesTool,
  RotatePdfTool,
  WatermarkPdfTool,
  SignPdfTool,
  ProtectPdfTool,
  RearrangePdfTool,
  PdfToImageTool,
  CompressPdfTool,
  UnlockPdfTool,
  EditPdfTool,
  OcrPdfTool,
} from "./pdf/PdfTools";

// Text Tools
import {
  CaseConverterTool,
  WordCounterTool,
  CharacterCounterTool,
  SentenceCounterTool,
  RemoveDuplicateLinesTool,
  TextSorterTool,
  TextCleanerTool,
  LoremIpsumGeneratorTool,
  RandomTextGeneratorTool,
  RemoveExtraSpacesTool,
  ReverseTextTool,
} from "./text/TextTools";

// Developer Tools
import {
  JsonFormatterTool,
  JsonValidatorTool,
  JsonMinifierTool,
  Base64EncoderTool,
  Base64DecoderTool,
  UrlEncoderTool,
  UrlDecoderTool,
  JwtDecoderTool,
  UuidGeneratorTool,
  HashGeneratorTool,
} from "./developer/DeveloperTools";

// Converters
import {
  LengthConverterTool,
  WeightConverterTool,
  TemperatureConverterTool,
  BinaryConverterTool,
  RomanNumeralConverterTool,
} from "./converters/ConverterTools";

// Calculators
import {
  AgeCalculatorTool,
  BmiCalculatorTool,
  PercentageCalculatorTool,
  EmiCalculatorTool,
  GstCalculatorTool,
} from "./calculators/CalculatorTools";

// Utilities
import {
  QrCodeGeneratorTool,
  BarcodeGeneratorTool,
  PasswordGeneratorTool,
  ColorPickerTool,
  CoinFlipperTool,
  NotepadOnlineTool,
} from "./utilities/UtilityTools";

// Image Tools
import {
  ImageCompressorTool,
  ImageResizerTool,
  RotateImageTool,
  ImageConverterTool,
  SvgConverterTool,
  ImageToPdfTool,
  CropImageTool,
  BackgroundRemoverTool,
  ImageUpscalerTool,
  ScreenshotTool,
} from "./image/ImageTools";

// Server Tools
import {
  CurrencyConverterServerTool,
  DnsLookupTool,
  WhoisLookupTool,
  SslCheckerTool,
  IpLookupTool,
  EmailValidatorTool,
  BrokenLinkCheckerTool,
  WebsiteSpeedTestTool,
} from "./server/ServerTools";

// AI Tools
import {
  AiWriterTool,
  AiGrammarTranslatorTool,
  AiDetectorTool,
} from "./ai/AiTools";

import { PlagiarismTool as PlagiarismCheckerTool } from "./ai/PlagiarismTool";

// Office Tools
import { OfficeConverterTool } from "./office/OfficeTools";

import { DiscountCalculatorTool, ProfitCalculatorTool, ScientificCalculatorTool, DateCalculatorTool, MortgageCalculatorTool, RoiCalculatorTool, TipCalculatorTool, MarginCalculatorTool } from "./calculators/AdditionalCalculators";
import { AreaConverterTool, DataStorageConverterTool, TimeZoneConverterTool } from "./converters/AdditionalConverters";
import { MetaTagGeneratorTool, RobotsTxtGeneratorTool, SitemapGeneratorTool, KeywordDensityCheckerTool, SerpPreviewTool, OpenGraphGeneratorTool, CanonicalTagGeneratorTool, SchemaMarkupGeneratorTool } from "./seo/SeoTools";
import { RandomNumberGeneratorTool, TimestampConverterTool, UnixTimeConverterTool, DiceRollerTool, StopwatchTool, TimerTool, TodoListOnlineTool, PasswordStrengthCheckerTool } from "./utilities/AdditionalUtilities";
import { AdditionalDeveloperTool } from "./developer/AdditionalDeveloperTools";

interface ToolDispatcherProps {
  tool: Pick<Tool, "id" | "name" | "category">;
}

const ToolWorkspace: React.FC<ToolDispatcherProps> = ({ tool }) => {
  switch (tool.id) {
    // PDF Tools
    case "merge-pdf":
      return <MergePdfTool />;
    case "split-pdf":
      return <SplitPdfTool />;
    case "delete-pdf-pages":
      return <DeletePdfPagesTool />;
    case "rearrange-pdf-pages":
      return <RearrangePdfTool />;
    case "rotate-pdf":
      return <RotatePdfTool />;
    case "pdf-to-jpg":
      return <PdfToImageTool lockedFormat="jpg" />;
    case "pdf-to-png":
      return <PdfToImageTool lockedFormat="png" />;
    case "jpg-to-pdf":
      return <ImageToPdfTool acceptMode="jpg" />;
    case "png-to-pdf":
      return <ImageToPdfTool acceptMode="png" />;
    case "watermark-pdf":
      return <WatermarkPdfTool />;
    case "sign-pdf":
      return <SignPdfTool />;
    case "protect-pdf":
      return <ProtectPdfTool />;
    case "unlock-pdf":
      return <UnlockPdfTool />;
    case "compress-pdf":
      return <CompressPdfTool />;
    case "edit-pdf":
      return <EditPdfTool />;
    case "ocr-pdf":
      return <OcrPdfTool />;

    // Image Tools
    case "image-compressor":
      return <ImageCompressorTool />;
    case "image-resizer":
      return <ImageResizerTool />;
    case "crop-image":
      return <CropImageTool />;
    case "background-remover":
      return <BackgroundRemoverTool />;
    case "image-upscaler":
      return <ImageUpscalerTool />;
    case "screenshot-tool":
      return <ScreenshotTool />;
    case "rotate-image":
      return <RotateImageTool />;
    case "convert-image":
      return <ImageConverterTool targetFormat="png" />;
    case "jpg-to-png":
    case "jfif-to-png":
    case "webp-to-png":
      return <ImageConverterTool targetFormat="png" />;
    case "png-to-jpg":
    case "webp-to-jpg":
    case "jpeg-to-jpg":
    case "heic-to-jpg":
      return <ImageConverterTool targetFormat="jpg" />;
    case "webp-converter":
      return <ImageConverterTool targetFormat="webp" />;
    case "svg-converter":
      return <SvgConverterTool />;
    case "image-to-pdf":
      return <ImageToPdfTool acceptMode="both" />;

    // AI & Writing Tools
    case "ai-writer":
      return <AiWriterTool taskType="write" />;
    case "ai-email-writer":
      return <AiWriterTool taskType="email" />;
    case "ai-summarizer":
      return <AiWriterTool taskType="summarize" />;
    case "paraphrasing-tool":
      return <AiWriterTool taskType="paraphrase" />;
    case "article-rewriter":
      return <AiWriterTool taskType="rewrite" />;
    case "ai-humanizer":
      return <AiWriterTool taskType="humanize" />;
    case "grammar-checker":
    case "spell-checker":
      return <AiGrammarTranslatorTool initialMode="grammar" toolId={tool.id} />;
    case "ai-translator":
      return <AiGrammarTranslatorTool initialMode="translate" toolId={tool.id} />;
    case "ai-detector":
      return <AiDetectorTool />;
    case "plagiarism-checker":
      return <PlagiarismCheckerTool />;

    // Office Document Conversion Tools
    case "pdf-to-word":
      return (
        <OfficeConverterTool
          lockedTargetFormat="docx"
          accept=".pdf,application/pdf"
          hint="Upload a PDF to convert to Word (.docx) in your browser."
        />
      );
    case "word-to-pdf":
      return (
        <OfficeConverterTool
          lockedTargetFormat="pdf"
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          hint="Upload a Word document (.docx) to convert to PDF."
        />
      );
    case "pdf-to-excel":
      return (
        <OfficeConverterTool
          lockedTargetFormat="xlsx"
          accept=".pdf,application/pdf"
          hint="Upload a PDF to export text into Excel (.xlsx)."
        />
      );
    case "excel-to-pdf":
      return (
        <OfficeConverterTool
          lockedTargetFormat="pdf"
          accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hint="Upload a spreadsheet to convert to PDF."
        />
      );
    case "pdf-to-powerpoint":
      return (
        <OfficeConverterTool
          lockedTargetFormat="pptx"
          accept=".pdf,application/pdf"
          hint="Upload a PDF to turn each page into a PowerPoint slide."
        />
      );
    case "powerpoint-to-pdf":
      return (
        <OfficeConverterTool
          lockedTargetFormat="pdf"
          accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          hint="Upload a PowerPoint file to convert to PDF."
        />
      );

    // Text Tools
    case "case-converter":
      return <CaseConverterTool />;
    case "word-counter":
      return <WordCounterTool />;
    case "character-counter":
      return <CharacterCounterTool />;
    case "sentence-counter":
      return <SentenceCounterTool />;
    case "remove-duplicate-lines":
      return <RemoveDuplicateLinesTool />;
    case "text-sorter":
      return <TextSorterTool />;
    case "text-cleaner":
      return <TextCleanerTool />;
    case "lorem-ipsum-generator":
      return <LoremIpsumGeneratorTool />;
    case "random-text-generator":
      return <RandomTextGeneratorTool />;
    case "remove-extra-spaces":
      return <RemoveExtraSpacesTool />;
    case "reverse-text":
      return <ReverseTextTool />;

    // Developer Tools
    case "json-formatter":
      return <JsonFormatterTool />;
    case "json-validator":
      return <JsonValidatorTool />;
    case "json-minifier":
      return <JsonMinifierTool />;
    case "base64-encoder":
      return <Base64EncoderTool />;
    case "base64-decoder":
      return <Base64DecoderTool />;
    case "url-encoder":
      return <UrlEncoderTool />;
    case "url-decoder":
      return <UrlDecoderTool />;
    case "jwt-decoder":
      return <JwtDecoderTool />;
    case "uuid-generator":
      return <UuidGeneratorTool />;
    case "hash-generator":
    case "md5-generator":
    case "sha256-generator":
      return <HashGeneratorTool />;

    // Converters
    case "currency-converter":
      return <CurrencyConverterServerTool />;
    case "length-converter":
      return <LengthConverterTool />;
    case "weight-converter":
      return <WeightConverterTool />;
    case "temperature-converter":
      return <TemperatureConverterTool />;
    case "binary-converter":
      return <BinaryConverterTool />;
    case "roman-numeral-converter":
      return <RomanNumeralConverterTool />;

    // Server Lookup & SEO Diagnostic Tools
    case "dns-lookup":
      return <DnsLookupTool />;
    case "whois-lookup":
      return <WhoisLookupTool />;
    case "ssl-checker":
      return <SslCheckerTool />;
    case "ip-lookup":
      return <IpLookupTool />;
    case "email-validator":
      return <EmailValidatorTool />;
    case "broken-link-checker":
      return <BrokenLinkCheckerTool />;
    case "website-speed-test":
      return <WebsiteSpeedTestTool />;

    // Calculators
    case "age-calculator":
      return <AgeCalculatorTool />;
    case "bmi-calculator":
      return <BmiCalculatorTool />;
    case "percentage-calculator":
      return <PercentageCalculatorTool />;
    case "emi-calculator":
    case "loan-calculator":
      return <EmiCalculatorTool />;
    case "gst-calculator":
    case "vat-calculator":
      return <GstCalculatorTool />;

    // Utilities
    case "qr-code-generator":
      return <QrCodeGeneratorTool />;
    case "barcode-generator":
      return <BarcodeGeneratorTool />;
    case "password-generator":
    case "random-password-generator":
      return <PasswordGeneratorTool />;
    case "uuid-generator-util":
      return <UuidGeneratorTool />;
    case "color-picker":
    case "color-converter":
      return <ColorPickerTool />;
    case "coin-flipper":
      return <CoinFlipperTool />;
    case "notepad-online":
      return <NotepadOnlineTool />;

    case "discount-calculator":
      return <DiscountCalculatorTool />;
    case "profit-calculator":
      return <ProfitCalculatorTool />;
    case "scientific-calculator":
      return <ScientificCalculatorTool />;
    case "date-calculator":
      return <DateCalculatorTool />;
    case "mortgage-calculator":
      return <MortgageCalculatorTool />;
    case "roi-calculator":
      return <RoiCalculatorTool />;
    case "tip-calculator":
      return <TipCalculatorTool />;
    case "margin-calculator":
      return <MarginCalculatorTool />;
    case "area-converter":
      return <AreaConverterTool />;
    case "data-storage-converter":
      return <DataStorageConverterTool />;
    case "time-zone-converter":
      return <TimeZoneConverterTool />;
    case "meta-tag-generator":
      return <MetaTagGeneratorTool />;
    case "robots-txt-generator":
      return <RobotsTxtGeneratorTool />;
    case "sitemap-generator":
      return <SitemapGeneratorTool />;
    case "keyword-density-checker":
      return <KeywordDensityCheckerTool />;
    case "serp-preview-tool":
      return <SerpPreviewTool />;
    case "open-graph-generator":
      return <OpenGraphGeneratorTool />;
    case "canonical-tag-generator":
      return <CanonicalTagGeneratorTool />;
    case "schema-markup-generator":
      return <SchemaMarkupGeneratorTool />;
    case "random-number-generator":
      return <RandomNumberGeneratorTool />;
    case "timestamp-converter":
      return <TimestampConverterTool />;
    case "unix-time-converter":
      return <UnixTimeConverterTool />;
    case "dice-roller":
      return <DiceRollerTool />;
    case "stopwatch":
      return <StopwatchTool />;
    case "timer":
      return <TimerTool />;
    case "todo-list-online":
      return <TodoListOnlineTool />;
    case "password-strength-checker":
      return <PasswordStrengthCheckerTool />;
    case "xml-formatter":
      return <AdditionalDeveloperTool operation="xml-formatter" />;
    case "xml-validator":
      return <AdditionalDeveloperTool operation="xml-validator" />;
    case "html-formatter":
      return <AdditionalDeveloperTool operation="html-formatter" />;
    case "html-minifier":
      return <AdditionalDeveloperTool operation="html-minifier" />;
    case "css-minifier":
      return <AdditionalDeveloperTool operation="css-minifier" />;
    case "javascript-minifier":
      return <AdditionalDeveloperTool operation="javascript-minifier" />;
    case "sql-formatter":
      return <AdditionalDeveloperTool operation="sql-formatter" />;

    default:
      return <ToolPlaceholder tool={tool} />;
  }
};



const subscribeToClientReadiness = () => () => undefined;
const clientReady = () => true;
const serverReady = () => false;

// SSR controls must stay inert until their React handlers can retain user input.
export const ToolDispatcher: React.FC<ToolDispatcherProps> = ({ tool }) => {
  const ready = useSyncExternalStore(subscribeToClientReadiness, clientReady, serverReady);
  return (
    <fieldset disabled={!ready} aria-busy={!ready} data-tool-workspace className="m-0 min-w-0 border-0 p-0">
      <ToolWorkspace tool={tool} />
    </fieldset>
  );
};
