import Link from "next/link";

import { categoryMeta, getCategoryCount, type Category } from "@/lib/tools";
import { getCategoryIcon } from "@/components/tool-cards/categoryIcon";

interface CategoryCardProps {
  category: Category;
  count?: number;
}

export function CategoryCard({ category, count }: CategoryCardProps) {
  const meta = categoryMeta[category];
  const toolCount = count ?? getCategoryCount(category);
  const Icon = getCategoryIcon(category);

  return (
    <Link href={`/category/${category}`} className="category-card group">
      <div className="flex items-start justify-between gap-3">
        <span
          className="category-card-icon"
          style={{ backgroundColor: `${meta.accent}1a`, color: meta.accent }}
        >
          <Icon className="h-6 w-6" />
        </span>
        <span className="rounded-full bg-[var(--surface-sunk)] px-2 py-1 text-xs text-[var(--ink-soft)]">
          {toolCount} tools
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--ink)]">
        {meta.name}
      </h3>
      <p className="mt-1.5 text-sm leading-6 text-[var(--ink-soft)]">
        {meta.description}
      </p>
    </Link>
  );
}
