interface AdSlotProps {
  label: string;
}

export function AdSlot({ label }: AdSlotProps) {
  return (
    <div className="rounded-[14px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-sunk)] px-4 py-8 text-center text-sm text-[var(--ink-faint)]">
      {label}
    </div>
  );
}
