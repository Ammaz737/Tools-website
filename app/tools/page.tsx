import { AdSlot } from "@/components/layout/AdSlot";
import { ToolCard } from "@/components/tool-cards/ToolCard";
import { getPublicTools } from "@/lib/public-tools";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const publicTools = await getPublicTools();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
          All tools
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--ink)]">
          {publicTools.length} free tools, 10 categories
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--ink-soft)]">
          Browse every active tool in the workshop. Inactive tools are hidden
          from this list by the admin panel.
        </p>
      </div>

      <div className="mt-10">
        <AdSlot label="Ad slot: tools listing" />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {publicTools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            usageCount={tool.usageCount}
          />
        ))}
      </div>
    </div>
  );
}
