interface AdSlotProps {
  label: string;
}

export function AdSlot({ label }: AdSlotProps) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--line)] px-4 py-3 text-center text-xs text-[var(--ink-faint)]">
      {label}
    </div>
  );
}
