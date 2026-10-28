import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ToolCard } from "@/components/tool-cards/ToolCard";
import { buildCategoryMetadata } from "@/lib/seo";
import { categories, categoryMeta, type Category } from "@/lib/tools";
import { getPublicToolsByCategory } from "@/lib/public-tools";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return categories.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!categories.includes(slug as Category)) {
    return {};
  }

  return buildCategoryMetadata(slug as Category);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  if (!categories.includes(slug as Category)) {
    notFound();
  }

  const category = slug as Category;
  const meta = categoryMeta[category];
  const categoryTools = await getPublicToolsByCategory(category);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <div
          className="mb-5 h-1.5 w-16 rounded-full"
          style={{ backgroundColor: meta.accent }}
        />
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
          Category
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--ink)]">
          {meta.name} tools
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--ink-soft)]">
          {meta.description}
        </p>
        <p className="mt-3 font-mono text-sm text-[var(--ink-faint)]">
          {categoryTools.length} tools in this shelf
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categoryTools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            usageCount={tool.usageCount}
          />
        ))}
      </div>
    </div>
  );
}
