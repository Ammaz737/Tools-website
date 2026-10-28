import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FolderOpen className="w-10 h-10 text-[var(--ink-faint)]" />,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-[14px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-sunk)]/50 ${className}`}
    >
      <div className="p-3 mb-3 rounded-full bg-[var(--surface)] border border-[var(--line)] shadow-xs">
        {icon}
      </div>
      <h3 className="font-semibold text-base text-[var(--ink)]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[var(--ink-soft)] max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
