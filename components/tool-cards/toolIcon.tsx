import {
  ArrowLeftRight,
  Braces,
  CaseSensitive,
  Code2,
  Crop,
  Eraser,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Fingerprint,
  Globe,
  Hash,
  ImageDown,
  Images,
  KeyRound,
  Languages,
  Link,
  ListOrdered,
  LockKeyhole,
  Merge,
  Minimize2,
  PenLine,
  QrCode,
  RotateCw,
  Ruler,
  ScanText,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Split,
  Timer,
  Type,
  UnlockKeyhole,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { categoryMeta, type Tool } from "@/lib/tools";
import { getCategoryIcon } from "./categoryIcon";

// Actions take precedence over category so adjacent tools are easy to recognize.
const rules: Array<[RegExp, LucideIcon]> = [
  [/merge|combine/, Merge],
  [/split/, Split],
  [/crop/, Crop],
  [/compress/, Minimize2],
  [/resiz|dimension|unit-converter/, Ruler],
  [/rotat|flip/, RotateCw],
  [/unlock/, UnlockKeyhole],
  [/protect|encrypt/, LockKeyhole],
  [/sign-pdf|signature|edit-pdf/, PenLine],
  [/delete|remove-pages|trim/, Scissors],
  [/background|eraser/, Eraser],
  [/rearrange|sort/, ListOrdered],
  [/ocr|extract-text/, ScanText],
  [/pdf-to-(jpg|png|image)/, Images],
  [/image-to-pdf|jpg-to-pdf|png-to-pdf/, FileImage],
  [/excel|csv|spreadsheet/, FileSpreadsheet],
  [/pdf-to-word|word-to-pdf|docx/, FileType],
  [/zip|archive/, FileArchive],
  [/json/, Braces],
  [/html|css|javascript|xml|sql/, Code2],
  [/hash|checksum|md5|sha/, Fingerprint],
  [/password|key/, KeyRound],
  [/ssl|security/, ShieldCheck],
  [/dns|whois|ip-address|domain/, Globe],
  [/url|link/, Link],
  [/qr|barcode/, QrCode],
  [/timer|stopwatch|time/, Timer],
  [/translat/, Languages],
  [/grammar|rewrit|paraphras/, WandSparkles],
  [/summar|ai-/, Sparkles],
  [/word-count|character|counter/, Hash],
  [/case/, CaseSensitive],
  [/text|font/, Type],
  [/search|seo|meta/, Search],
  [/to-jpg|to-png|to-webp|to-avif|image-convert/, ImageDown],
  [/convert/, ArrowLeftRight],
  [/pdf/, FileText],
];

export function getToolIcon(tool: Pick<Tool, "id" | "category">): LucideIcon {
  return (
    rules.find(([pattern]) => pattern.test(tool.id))?.[1] ??
    getCategoryIcon(tool.category)
  );
}

export function getToolAccent(tool: Pick<Tool, "id" | "category">): string {
  if (/merge|rearrange/.test(tool.id)) return "#8364d9";
  if (/split|delete|trim/.test(tool.id)) return "#e85b8d";
  if (/sign|edit|watermark/.test(tool.id)) return "#13a99c";
  if (/pdf-to-(jpg|png)|image-to-pdf|jpg-to-pdf|png-to-pdf/.test(tool.id))
    return "#e7a919";
  if (/pdf-to-word|word-to-pdf/.test(tool.id)) return "#377bd8";
  if (/excel|spreadsheet/.test(tool.id)) return "#25a579";
  if (/compress/.test(tool.id)) return "#ef615c";
  return categoryMeta[tool.category].accent;
}
