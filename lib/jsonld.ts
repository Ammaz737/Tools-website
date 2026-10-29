import type { Tool } from "./tools";
import type { BlogPost } from "./blog";
import { siteOrigin } from "./site-config";

export function generateToolJsonLd(tool: Tool, origin: string = siteOrigin()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.blurb,
    url: `${origin}/tools/${tool.id}`,
    applicationCategory: tool.category,
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5 web browser.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function generateBlogPostingJsonLd(post: BlogPost, origin: string = siteOrigin()) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle,
    description: post.seoDescription,
    url: `${origin}/blog/${post.slug}`,
    datePublished: "2026-10-28",
    dateModified: "2026-10-28",
    inLanguage: "en",
    author: {
      "@type": "Organization",
      name: "ALETOOL",
      url: origin,
    },
    publisher: {
      "@type": "Organization",
      name: "ALETOOL",
      url: origin,
    },
  };
}

export interface BreadcrumbInput {
  name: string;
  /** Site-relative path (e.g. "/tools") or absolute URL. Omit for the current page. */
  path?: string;
}

/**
 * BreadcrumbList matching the visible Breadcrumbs component exactly:
 * same labels, same hrefs, current page last with no href.
 */
export function generateBreadcrumbJsonLd(
  items: BreadcrumbInput[],
  origin: string = siteOrigin(),
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path
        ? {
            item: item.path.startsWith("http")
              ? item.path
              : `${origin}${item.path}`,
          }
        : {}),
    })),
  };
}

export interface FaqQA {
  question: string;
  answer: string;
}

/** FAQPage from FAQs already rendered on the page. Returns null when empty. */
export function generateFaqJsonLd(faqs: FaqQA[] | undefined | null) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * The FAQs ToolShell actually renders: the tool-specific set when one
 * exists (pdfToolContent), otherwise the generic defaults ToolShell
 * falls back to. Mirrors ToolShell's trust notice so the schema
 * matches the visible copy exactly.
 */
export function resolveToolFaqs(
  tool: Tool,
  faqs?: FaqQA[],
): FaqQA[] {
  if (faqs && faqs.length > 0) return faqs;
  const trustNotice = ["word-to-pdf", "excel-to-pdf", "powerpoint-to-pdf"].includes(tool.id)
    ? "Browser conversion stays on this device. Choosing the server option uploads your document."
    : tool.runtime === "client"
      ? "Your input stays on this device for this operation."
      : "Your input is sent to complete this request. Avoid submitting sensitive information.";
  return [
    {
      question: `Is ${tool.name} free to use?`,
      answer: `${tool.name} is currently free to use. File, request and availability limits may apply.`,
    },
    {
      question: "Are my files or inputs stored on your server?",
      answer: trustNotice,
    },
    {
      question: "Does this work on mobile devices?",
      answer:
        "Yes, every tool in our workshop is optimized for smartphones, tablets, and desktop computers.",
    },
  ];
}

/** HowTo from a blog post's numbered steps, matching the rendered list. */
export function generateHowToJsonLd(post: BlogPost, origin: string = siteOrigin()) {
  if (!post.steps || post.steps.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${post.toolName} online, free`,
    description: post.seoDescription,
    url: `${origin}/blog/${post.slug}`,
    inLanguage: "en",
    step: post.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: `Step ${index + 1}`,
      text: step,
    })),
  };
}

/** WebSite with a SearchAction pointing at the existing /tools?q= search. */
export function generateWebSiteJsonLd(origin: string = siteOrigin()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ALETOOL",
    url: origin,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/tools?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
