import { isMongoConfigured } from "@/lib/db";
import type { Metadata } from "next";

import { categoryMeta, type Category, type Tool } from "@/lib/tools";
import { isImplementedTool } from "@/lib/tool-capabilities";
import { siteOrigin } from "@/lib/site-config";

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

const siteName = "Quiet Workshop Tools";
const siteDescription =
  "A calm, private toolbox for PDFs, images, text, developer tasks, and everyday utilities.";

export function buildSiteMetadata(): Metadata {
  return {
    metadataBase: new URL(siteOrigin()),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
  };
}

export function buildToolMetadata(tool: Tool): Metadata {
  return {
    robots: { index: isToolIndexable(tool), follow: true },
    title: tool.name,
    description: tool.blurb,
    alternates: {
      canonical: `/tools/${tool.id}`,
    },
    openGraph: {
      title: `${tool.name} | ${siteName}`,
      description: tool.blurb,
      type: "website",
      url: `/tools/${tool.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} | ${siteName}`,
      description: tool.blurb,
    },
  };
}

export function buildCategoryMetadata(category: Category): Metadata {
  const meta = categoryMeta[category];

  return {
    title: `${meta.name} Tools`,
    description: meta.description,
    alternates: {
      canonical: `/category/${category}`,
    },
    openGraph: {
      title: `${meta.name} Tools | ${siteName}`,
      description: meta.description,
      type: "website",
      url: `/category/${category}`,
    },
  };
}
