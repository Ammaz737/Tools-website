import Link from "next/link";

import { AdSlot } from "@/components/layout/AdSlot";
import { CategoryCard } from "@/components/tool-cards/CategoryCard";
import { ToolCard } from "@/components/tool-cards/ToolCard";
import { categories } from "@/lib/tools";
import {
  getPublicCategoryCounts,
  getPublicFeaturedTools,
  getPublicNewTools,
  getPublicTools,
} from "@/lib/public-tools";

export const dynamic = "force-dynamic";

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

  return (
    <div className="grain">
      <section className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
            Quiet Workshop
          </p>
          <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-tight text-[var(--ink)] sm:text-6xl">
            A quiet workshop for {publicTools.length} small jobs.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
            A browser-first toolbox for PDFs, images, developer tasks, and
            everyday utilities. Build fast, stay private, and avoid unnecessary
            uploads.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tools"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Explore all tools
            </Link>
            <Link
              href="/category/pdf"
              className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm text-[var(--ink)]"
            >
              Browse PDF tools
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-sm text-[var(--ink-soft)]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
            Live mini-tool
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Word counter
          </h2>
          <div className="mt-5 rounded-[10px] border border-[var(--line)] bg-[var(--surface-sunk)] p-4 text-sm leading-6 text-[var(--ink-soft)]">
            This architecture pass keeps the mini-tool presentational for now.
            The real logic can be added later without changing the homepage
            layout.
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface-sunk)] p-4">
              <p className="font-mono text-2xl text-[var(--ink)]">0</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Words</p>
            </div>
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface-sunk)] p-4">
              <p className="font-mono text-2xl text-[var(--ink)]">0</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Characters</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdSlot label="Ad slot: home top" />
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
              Popular tools
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
              Start with the essentials
            </h2>
          </div>
          <Link href="/tools" className="text-sm text-[var(--accent)]">
            View all tools
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
          Categories
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Ten focused shelves
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
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
          Recently added
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Newer, more ambitious tools
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
