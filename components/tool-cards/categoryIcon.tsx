import {
  ArrowLeftRight,
  Calculator,
  CaseSensitive,
  Code2,
  FileText,
  Image,
  Search,
  Shield,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { categoryMeta, type Category } from "@/lib/tools";

/**
 * Lucide icon per category, keyed by the icon name stored in
 * categoryMeta (lib/tools.ts is intentionally left untouched).
 */
const iconByName: Record<string, LucideIcon> = {
  FileText,
  Image,
  Sparkles,
  CaseSensitive,
  Code2,
  Search,
  Shield,
  ArrowLeftRight,
  Calculator,
  Wrench,
};

export function getCategoryIcon(category: Category): LucideIcon {
  return iconByName[categoryMeta[category].icon] ?? Wrench;
}
