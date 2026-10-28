import Link from "next/link";

import { categoryMeta, getCategoryCount, type Category } from "@/lib/tools";

interface CategoryCardProps {
  category: Category;
  count?: number;
}

export function CategoryCard({ category, count }: CategoryCardProps) {
  const meta = categoryMeta[category];
  const toolCount = count ?? getCategoryCount(category);

  return (
    <Link
      href={`/category/${category}`}
      className="block rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
    >
      <div
        className="mb-4 h-1.5 w-14 rounded-full"
        style={{ backgroundColor: meta.accent }}
      />
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          {meta.name}
        </h3>
        <span className="rounded-full bg-[var(--surface-sunk)] px-2 py-1 font-mono text-xs text-[var(--ink-soft)]">
          {toolCount} tools
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
        {meta.description}
      </p>
    </Link>
  );
}
