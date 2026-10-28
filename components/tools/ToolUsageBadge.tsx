"use client";

import { useToolUsage } from "@/lib/hooks/useToolUsage";

interface ToolUsageBadgeProps {
  toolId: string;
  initialCount?: number;
}

export function ToolUsageBadge({
  toolId,
  initialCount = 0,
}: ToolUsageBadgeProps) {
  const { usageCount } = useToolUsage(toolId, initialCount);

  return (
    <span
      key={`${toolId}-${initialCount}`}
      className="rounded-full bg-[var(--surface-sunk)] px-3 py-1 font-mono text-xs text-[var(--ink-soft)]"
    >
      {usageCount.toLocaleString()} uses
    </span>
  );
}
