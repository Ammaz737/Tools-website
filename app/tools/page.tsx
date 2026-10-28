import Link from "next/link";

import { AdSlot } from "@/components/layout/AdSlot";
import { ToolCard } from "@/components/tool-cards/ToolCard";
import { getPublicTools } from "@/lib/public-tools";

export const dynamic = "force-dynamic";

interface ToolsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const allTools = await getPublicTools();
  const publicTools = query
    ? allTools.filter((tool) =>
        [tool.name, tool.blurb, tool.id, tool.category, ...tool.keywords]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : allTools;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          All tools
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-[var(--ink)]">
          {query
            ? `${publicTools.length} result${publicTools.length === 1 ? "" : "s"} for “${q?.trim()}”`
            : `${allTools.length} free tools, 10 categories`}
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--ink-soft)]">
          {query ? (
            <>
              Showing tools matching your search.{" "}
              <Link href="/tools" className="font-medium text-[var(--accent)] hover:underline">
                Clear search
              </Link>
            </>
          ) : (
            "Browse every active tool in the workshop. Inactive tools are hidden from this list by the admin panel."
          )}
        </p>
      </div>

      <form
        action="/tools"
        method="get"
        role="search"
        className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] p-1.5 shadow-sm focus-within:border-[var(--accent)]"
      >
        <input
          type="search"
          name="q"
          defaultValue={q?.trim() ?? ""}
          placeholder="Search tools…"
          aria-label="Search tools"
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </form>

      <div className="mt-10">
        <AdSlot label="Ad slot: tools listing" />
      </div>

      {publicTools.length === 0 ? (
        <p className="mt-10 text-lg text-[var(--ink-soft)]">
          No tools match that search. Try another keyword, or{" "}
          <Link href="/tools" className="font-medium text-[var(--accent)] hover:underline">
            browse all tools
          </Link>
          .
        </p>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {publicTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              usageCount={tool.usageCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
