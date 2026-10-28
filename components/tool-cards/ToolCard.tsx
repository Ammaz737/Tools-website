import Link from "next/link";

import { categoryMeta, type Tool } from "@/lib/tools";
import { isImplementedTool } from "@/lib/tool-capabilities";
import { getCategoryIcon } from "@/components/tool-cards/categoryIcon";

interface ToolCardProps {
  tool: Tool;
  usageCount?: number;
}

export function ToolCard({ tool, usageCount }: ToolCardProps) {
  const accent = categoryMeta[tool.category].accent;
  const Icon = getCategoryIcon(tool.category);

  return (
    <Link
      href={`/tools/${tool.id}`}
      className="group block rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          <Icon className="h-6 w-6" />
        </span>
        {!isImplementedTool(tool.id) && (
          <span className="rounded-full bg-[var(--surface-sunk)] px-2 py-1 text-xs text-[var(--ink-soft)]">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="mt-4 font-semibold text-[var(--ink)]">{tool.name}</h3>
      <p className="mt-1.5 text-sm leading-6 text-[var(--ink-soft)]">
        {tool.blurb}
      </p>
      {typeof usageCount === "number" && usageCount > 0 && (
        <p className="mt-4 text-xs text-[var(--ink-faint)]">
          {usageCount.toLocaleString()} uses
        </p>
      )}
    </Link>
  );
}
