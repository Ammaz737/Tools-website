import Link from "next/link";

import { type Tool } from "@/lib/tools";
import { isImplementedTool } from "@/lib/tool-capabilities";
import { getToolAccent, getToolIcon } from "@/components/tool-cards/toolIcon";
import { ArrowUpRight } from "lucide-react";

interface ToolCardProps {
  tool: Tool;
  usageCount?: number;
}

export function ToolCard({ tool, usageCount }: ToolCardProps) {
  const accent = getToolAccent(tool);
  const Icon = getToolIcon(tool);

  return (
    <Link href={`/tools/${tool.id}`} className="tool-card group">
      <div className="tool-card-top">
        <span
          className="tool-card-icon"
          style={{ backgroundColor: accent, color: "white" }}
        >
          <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
        </span>
        {!isImplementedTool(tool.id) && (
          <span className="rounded-full bg-[var(--surface-sunk)] px-2 py-1 text-xs text-[var(--ink-soft)]">
            Coming soon
          </span>
        )}
        {isImplementedTool(tool.id) && (
          <ArrowUpRight
            aria-hidden="true"
            className="h-4 w-4 text-[var(--ink-faint)] transition-colors group-hover:text-[var(--accent)]"
          />
        )}
      </div>
      <h3>{tool.name}</h3>
      <p className="tool-card-description">{tool.blurb}</p>
      {typeof usageCount === "number" && usageCount > 0 && (
        <p className="mt-4 text-xs text-[var(--ink-faint)]">
          {usageCount.toLocaleString()} uses
        </p>
      )}
    </Link>
  );
}
