import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ToolCard } from "@/components/tool-cards/ToolCard";
import { getCategoryIcon } from "@/components/tool-cards/categoryIcon";
import { buildCategoryMetadata } from "@/lib/seo";
import { generateBreadcrumbJsonLd } from "@/lib/jsonld";
import { categoryContent } from "@/lib/category-content";
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
  const Icon = getCategoryIcon(category);
  // JSON-LD only: this page has no visible breadcrumb nav, so the trail
  // mirrors the page heading (Home > "{Category} tools").
  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: `${meta.name} tools` },
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="max-w-3xl">
        <span
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${meta.accent}1a`, color: meta.accent }}
        >
          <Icon className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Category
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-[var(--ink)]">
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

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
          About {meta.name} tools
        </h2>
        <div className="mt-5 space-y-5">
          {categoryContent[category].intro.map((paragraph, idx) => (
            <p key={idx} className="leading-8 text-[var(--ink-soft)]">
              {paragraph}
            </p>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-[var(--ink)]">
          Frequently asked questions
        </h2>
        <div className="mt-5 space-y-4">
          {categoryContent[category].faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <h3 className="font-semibold text-[var(--ink)]">{faq.q}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
