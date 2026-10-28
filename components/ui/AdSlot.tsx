"use client";

import React from "react";

export interface AdSlotProps {
  slotId?: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slotId = "default-slot",
  format = "horizontal",
  className = "",
}) => {
  return (
    <div
      className={`my-6 p-4 rounded-[10px] bg-[var(--surface-sunk)] border border-[var(--line)] text-center transition-all ${className}`}
    >
      <div className="flex flex-col items-center justify-center min-h-[90px]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-faint)] mb-1">
          Advertisement
        </span>
        <div className="w-full max-w-lg py-2 rounded-[6px] border border-dashed border-[var(--line)] text-xs text-[var(--ink-soft)] font-mono">
          Ad Slot ({format} • {slotId})
        </div>
      </div>
    </div>
  );
};
