import type { Metadata } from "next";
import Link from "next/link";

import { AdSlot } from "@/components/layout/AdSlot";
import { CategoryCard } from "@/components/tool-cards/CategoryCard";
import { ToolCard } from "@/components/tool-cards/ToolCard";
import { categories } from "@/lib/tools";
import { languageAlternates, ogImageUrl } from "@/lib/seo";
import { generateWebSiteJsonLd } from "@/lib/jsonld";
import {
  getPublicCategoryCounts,
  getPublicFeaturedTools,
  getPublicNewTools,
  getPublicTools,
} from "@/lib/public-tools";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const path = "/";
  const ogImage = ogImageUrl(
    "137 Free Online Tools, No Signup",
    "PDF, image, AI, text, developer, SEO, security, converter, calculator & utility tools.",
  );
  return {
    robots: { index: true, follow: true },
    title: {
      absolute:
        "Free Online Tools — PDF, Image, AI & More | Quiet Workshop Tools",
    },
    description:
      "137 free online tools: merge, split, and compress PDFs, convert images, check AI writing, calculate loans, and more. No signup, no watermark. Most tools run in your browser.",
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
    openGraph: {
      title: "Free Online Tools — PDF, Image, AI & More",
      description:
        "137 free online tools with no signup: PDF, image, AI, text, developer, SEO, security, converter, calculator, and utility tools.",
      type: "website",
      url: path,
      locale: "en_US",
      siteName: "Quiet Workshop Tools",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Quiet Workshop Tools — 137 Free Online Tools" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Free Online Tools — PDF, Image, AI & More",
      description:
        "137 free online tools with no signup: PDF, image, AI, text, developer, SEO, security, converter, calculator, and utility tools.",
      images: [ogImage],
    },
  };
}

const trustChips = [
  "No signup",
  "No watermark",
  "Private by default",
  "Works locally where possible",
];

export default async function HomePage() {
  const [featured, recent, publicTools, categoryCounts] = await Promise.all([
    getPublicFeaturedTools(12),
    getPublicNewTools(6),
    getPublicTools(),
    getPublicCategoryCounts(),
  ]);
  const webSiteLd = generateWebSiteJsonLd();

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webSiteLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* SmallPDF-style centered hero */}
      <section className="mx-auto w-full max-w-7xl bg-gradient-to-b from-[var(--accent-soft)] to-transparent px-4 pb-10 pt-16 text-center sm:px-6 lg:px-8 lg:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          {publicTools.length} free tools · No signup
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-5xl">
          Every tool you need, in one place.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
          A browser-first toolbox for PDFs, images, developer tasks, and
          everyday utilities. Build fast, stay private, and avoid unnecessary
          uploads.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/tools"
            className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Explore all tools
          </Link>
          <Link
            href="/category/pdf"
            className="rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
          >
            Browse PDF tools
          </Link>
        </div>
        <form
          action="/tools"
          method="get"
          role="search"
          className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] p-1.5 shadow-sm focus-within:border-[var(--accent)]"
        >
          <input
            type="search"
            name="q"
            placeholder="Search 137 tools — try “merge pdf”…"
            aria-label="Search tools"
            className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {trustChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-[var(--surface-sunk)] px-3 py-1 text-sm text-[var(--ink-soft)]"
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdSlot label="Ad slot: home top" />
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
            Most popular tools
          </h2>
          <Link
            href="/tools"
            className="shrink-0 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View all tools →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featured.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              usageCount={tool.usageCount}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
          Browse by category
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category}
              category={category}
              count={categoryCounts[category]}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
          Recently added
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recent.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              usageCount={tool.usageCount}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
