import React from "react";

export interface ProgressBarProps {
  value?: number; // 0 to 100, undefined for indeterminate
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercent = true,
  className = "",
}) => {
  const isIndeterminate = value === undefined;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || (showPercent && !isIndeterminate)) && (
        <div className="flex items-center justify-between text-xs text-[var(--ink-soft)]">
          {label && <span>{label}</span>}
          {showPercent && !isIndeterminate && (
            <span className="font-mono font-medium">{Math.round(value)}%</span>
          )}
        </div>
      )}

      <div className="w-full h-2 bg-[var(--surface-sunk)] border border-[var(--line)] rounded-full overflow-hidden">
        {isIndeterminate ? (
          <div className="h-full bg-[var(--accent)] rounded-full animate-pulse w-2/3" />
        ) : (
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        )}
      </div>
    </div>
  );
};
