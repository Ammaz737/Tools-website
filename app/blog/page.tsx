import type { Metadata } from "next";
import Link from "next/link";

import {
  getBlogPostsGroupedByCategory,
  getEditorialBlogPosts,
} from "@/lib/blog-posts";
import { languageAlternates } from "@/lib/seo";
import { generateBreadcrumbJsonLd } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const path = "/blog";
  return {
    robots: { index: true, follow: true },
    title: {
      absolute:
        "Tool Guides & How-Tos — Free Online Tools Blog | ALETOOL",
    },
    description:
      "Step-by-step guides for all 137 free ALETOOL tools: merge PDFs, compress images, format JSON, calculate loans, and more. No signup, most tools run in your browser.",
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
    openGraph: {
      title: "Tool Guides & How-Tos — ALETOOL Blog",
      description:
        "Step-by-step guides for all 137 free ALETOOL tools, grouped by category.",
      type: "website",
      url: path,
      locale: "en_US",
      siteName: "ALETOOL",
    },
  };
}

export default function BlogIndexPage() {
  const groups = getBlogPostsGroupedByCategory();
  const editorialPosts = getEditorialBlogPosts();
  // Category groups show the single-tool guides; editorial posts get their
  // own clearly marked section below so both kinds stay browsable.
  const toolGroups = groups.map((group) => ({
    ...group,
    posts: group.posts.filter((post) => post.toolId !== undefined),
  }));
  const total = groups.reduce((sum, group) => sum + group.posts.length, 0);
  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog" },
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Blog
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-[var(--ink)]">
          Tool guides &amp; how-tos
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--ink-soft)]">
          {total} guides for the workshop: step-by-step guides for every free
          tool, grouped by category, plus editorial guides and comparisons.
          Each guide explains what the tool does, how to use it, and what to
          expect — including honest limits.
        </p>
      </div>

      {editorialPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
            Editorial guides &amp; comparisons
          </h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Roundups and head-to-head guides that compare several tools at
            once, rather than covering a single tool.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {editorialPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                  Editorial guide
                </span>
                <h3 className="mt-2 font-semibold text-[var(--ink)] group-hover:text-[var(--accent)]">
                  {post.toolName}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--ink-soft)]">
                  {post.seoDescription}
                </p>
                <span className="mt-4 block text-sm font-medium text-[var(--accent)]">
                  Read guide →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 space-y-14">
        {toolGroups.map((group) => (
          <section key={group.category}>
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
                  {group.name} guides
                </h2>
                <p className="mt-2 text-[var(--ink-soft)]">
                  {group.description}
                </p>
              </div>
              <Link
                href={`/category/${group.category}`}
                className="shrink-0 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                View all {group.name} tools →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg"
                >
                  <h3 className="font-semibold text-[var(--ink)] group-hover:text-[var(--accent)]">
                    {post.toolName} guide
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--ink-soft)]">
                    {post.seoDescription}
                  </p>
                  <span className="mt-4 block text-sm font-medium text-[var(--accent)]">
                    Read guide →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
