import Link from "next/link";

import { categoryMeta, type Tool } from "@/lib/tools";
import { isImplementedTool } from "@/lib/tool-capabilities";

interface ToolCardProps {
  tool: Tool;
  usageCount?: number;
}

export function ToolCard({ tool, usageCount }: ToolCardProps) {
  return (
    <Link
      href={`/tools/${tool.id}`}
      className="group block rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
    >
      <div
        className="mb-4 h-1.5 w-14 rounded-full"
        style={{ backgroundColor: categoryMeta[tool.category].accent }}
      />
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-medium text-[var(--ink)]">{tool.name}</h3>
        {!isImplementedTool(tool.id) && <span className="rounded-full bg-[var(--surface-sunk)] px-2 py-1 text-xs text-[var(--ink-soft)]">Coming soon</span>}
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
        {tool.blurb}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--accent)]">Open tool →</p>
        {typeof usageCount === "number" && (
          <p className="font-mono text-xs text-[var(--ink-faint)]">
            {usageCount.toLocaleString()} uses
          </p>
        )}
      </div>
    </Link>
  );
}
