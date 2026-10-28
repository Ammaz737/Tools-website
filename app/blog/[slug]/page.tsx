import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import {
  getBlogPostBySlug,
  getRelatedBlogPosts,
  blogPosts,
} from "@/lib/blog-posts";
import { buildBlogMetadata } from "@/lib/seo";
import {
  generateBlogPostingJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateHowToJsonLd,
} from "@/lib/jsonld";
import { categoryMeta, tools } from "@/lib/tools";
import { isEditorialPost } from "@/lib/blog";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export const dynamic = "force-dynamic";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  return post ? buildBlogMetadata(post) : {};
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const related = getRelatedBlogPosts(post);
  const categoryName = categoryMeta[post.category].name;
  const editorial = isEditorialPost(post);
  // Display title: tool posts keep "X guide"; editorial posts use the
  // headline itself (they have no single tool).
  const displayTitle = editorial ? post.toolName : `${post.toolName} guide`;
  const featuredTools = (post.featuredToolIds ?? [])
    .map((id) => tools.find((tool) => tool.id === id))
    .filter((tool) => tool !== undefined);
  const jsonLd = generateBlogPostingJsonLd(post);
  // Matches the visible Breadcrumbs above exactly.
  const breadcrumbLd = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: categoryName, path: `/category/${post.category}` },
    { name: displayTitle },
  ]);
  const faqLd = generateFaqJsonLd(
    post.faqs.map((faq) => ({ question: faq.q, answer: faq.a })),
  );
  const howToLd = generateHowToJsonLd(post);
  const jsonLdBlocks = [
    jsonLd,
    breadcrumbLd,
    ...(faqLd ? [faqLd] : []),
    ...(howToLd ? [howToLd] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {jsonLdBlocks.map((block, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, "\\u003c"),
          }}
        />
      ))}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: categoryName, href: `/category/${post.category}` },
          { label: displayTitle },
        ]}
      />

      <article className="mx-auto mt-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          {editorial ? "Editorial guide" : `${categoryName} guide`}
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-5xl">
          {editorial ? post.toolName : `How to use ${post.toolName} online, free`}
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--ink-soft)]">
          {post.seoDescription}
        </p>

        <div className="mt-8 space-y-5">
          {post.intro.map((paragraph, idx) => (
            <p key={idx} className="leading-8 text-[var(--ink-soft)]">
              {paragraph}
            </p>
          ))}
        </div>

        {post.toolId && (
          <div className="mt-8 rounded-xl bg-[var(--accent)] p-5 text-center">
            <Link
              href={`/tools/${post.toolId}`}
              className="text-base font-semibold text-white hover:underline"
            >
              Try {post.toolName} →
            </Link>
            <p className="mt-1 text-sm text-white/80">
              Free, no signup — opens the tool directly.
            </p>
          </div>
        )}

        {featuredTools.length > 0 && (
          <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <h2 className="font-semibold text-[var(--ink)]">
              Tools featured in this guide
            </h2>
            <ul className="mt-3 space-y-2">
              {featuredTools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/tools/${tool.id}`}
                    className="text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    {tool.name} →
                  </Link>
                  <span className="ml-2 text-sm text-[var(--ink-soft)]">
                    {tool.blurb}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(post.sections ?? []).map((section, idx) => (
          <section key={idx}>
            <h2 className="mt-12 text-2xl font-bold tracking-tight text-[var(--ink)]">
              {section.heading}
            </h2>
            <div className="mt-5 space-y-5">
              {section.paragraphs.map((paragraph, pIdx) => (
                <p key={pIdx} className="leading-8 text-[var(--ink-soft)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}

        {post.steps.length > 0 && (
          <>
            <h2 className="mt-12 text-2xl font-bold tracking-tight text-[var(--ink)]">
              How to use {post.toolName}
            </h2>
            <ol className="mt-5 space-y-4">
              {post.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-mono text-xs font-bold text-[var(--accent)]">
                    {idx + 1}
                  </span>
                  <span className="leading-7 text-[var(--ink-soft)]">{step}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-[var(--ink)]">
          {editorial ? "Key takeaways" : `Why use ${post.toolName}`}
        </h2>
        <ul className="mt-5 space-y-3">
          {post.benefits.map((benefit, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              <span className="leading-7 text-[var(--ink-soft)]">{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-xl border border-[var(--line)] bg-[var(--surface-sunk)] p-5">
          <h2 className="font-semibold text-[var(--ink)]">
            Privacy &amp; how it works
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            {post.privacyNote}
          </p>
        </div>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-[var(--ink)]">
          Frequently asked questions
        </h2>
        <div className="mt-5 space-y-4">
          {post.faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5"
            >
              <h3 className="font-semibold text-[var(--ink)]">{faq.q}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {post.toolId && (
            <Link
              href={`/tools/${post.toolId}`}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Open {post.toolName}
            </Link>
          )}
          <Link
            href={`/category/${post.category}`}
            className="rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
          >
            More {categoryName} tools
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Related guides
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="group block rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg"
              >
                <h3 className="font-semibold text-[var(--ink)] group-hover:text-[var(--accent)]">
                  {isEditorialPost(rel) ? rel.toolName : `${rel.toolName} guide`}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--ink-soft)]">
                  {rel.seoDescription}
                </p>
                <span className="mt-4 block text-sm font-medium text-[var(--accent)]">
                  Read guide →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
