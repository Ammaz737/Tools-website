"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { ToolCard } from "@/components/tool-cards/ToolCard";
import { getToolIcon } from "@/components/tool-cards/toolIcon";
import { categoryMeta, type Tool } from "@/lib/tools";

export function ToolSearch({ tools }: { tools: Tool[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const id = useId();
  const matches = query.trim()
    ? tools
        .filter((tool) =>
          `${tool.name} ${tool.blurb} ${tool.keywords.join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .slice(0, 5)
    : [];
  return (
    <div
      className="home-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <form action="/tools" role="search" className="search-field">
        <Search size={20} aria-hidden="true" />
        <input
          name="q"
          type="search"
          aria-label="Search tools"
          aria-describedby={`${id}-hint`}
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setFocused(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setFocused(false);
            }
          }}
          placeholder="What would you like to do?"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            className="search-clear"
            onClick={() => setQuery("")}
          >
            <X size={16} />
          </button>
        )}
        <button className="search-submit" type="submit" aria-label="Search">
          <ArrowRight size={20} />
        </button>
      </form>
      <p id={`${id}-hint`} className="search-hint">
        Try “merge PDF”, “resize image” or “word counter”
      </p>
      {focused && query.trim() && (
        <div className="search-suggestions">
          <p className="suggestion-label">
            {matches.length
              ? "Suggested tools"
              : "No matching tools. Try another keyword."}
          </p>
          {matches.map((tool) => {
            const Icon = getToolIcon(tool);
            return (
              <Link
                href={`/tools/${tool.id}`}
                key={tool.id}
                className="suggestion"
              >
                <Icon
                  size={19}
                  style={{ color: categoryMeta[tool.category].accent }}
                />
                <span>{tool.name}</span>
                <ArrowRight size={15} />
              </Link>
            );
          })}
          {matches.length > 0 && (
            <Link
              className="suggestion-all"
              href={`/tools?q=${encodeURIComponent(query.trim())}`}
            >
              See all results <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const tabs = [
  { id: "all", name: "Popular" },
  { id: "pdf", name: "PDF" },
  { id: "image", name: "Image" },
  { id: "text", name: "Text" },
  { id: "developer", name: "Developer" },
  { id: "ai", name: "AI writing" },
];

export function ToolExplorer({
  tools,
  featuredIds,
}: {
  tools: Tool[];
  featuredIds: string[];
}) {
  const [category, setCategory] = useState("all");
  const regionId = useId();
  const visible = (
    category === "all"
      ? tools.filter((tool) => featuredIds.includes(tool.id))
      : tools.filter((tool) => tool.category === category)
  ).slice(0, 9);
  return (
    <>
      <div className="tool-filters" aria-label="Filter tools by category">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={category === tab.id}
            aria-controls={regionId}
            onClick={() => setCategory(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <div id={regionId} className="popular-grid" aria-live="polite">
        {visible.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
      <div className="section-action">
        <Link
          className="site-button site-button-outline"
          href={category === "all" ? "/tools" : `/category/${category}`}
        >
          See all{" "}
          {category === "all"
            ? "tools"
            : `${tabs.find((tab) => tab.id === category)?.name} tools`}{" "}
          <ArrowRight size={17} />
        </Link>
      </div>
    </>
  );
}
