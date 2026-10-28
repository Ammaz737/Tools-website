import type { Tool } from "@/lib/tools";

interface ToolPlaceholderProps {
  tool: Pick<Tool, "name">;
}

export function ToolPlaceholder({ tool }: ToolPlaceholderProps) {
  return (
    <section className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm text-[var(--accent)]">
          Coming soon
        </span>
      </div>
      <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        This tool is not available yet
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
        <strong>{tool.name}</strong> is being prepared. Please choose another tool from the related options below.
      </p>
    </section>
  );
}
