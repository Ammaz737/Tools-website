import type { Category } from "./tools";

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogPost {
  /**
   * URL slug. For tool posts this equals the tool id, e.g. "merge-pdf".
   * Editorial posts use a topic slug, e.g. "best-free-pdf-tools-online".
   */
  slug: string;
  /**
   * Tool id this post is about (same as slug for tool posts). Editorial
   * posts have no single tool, so toolId is omitted and they link out to
   * several tools via featuredToolIds instead.
   */
  toolId?: string;
  /**
   * Display name: the tool name for tool posts, e.g. "Merge PDF"; the
   * editorial headline for editorial posts, e.g. "Best Free PDF Tools".
   */
  toolName: string;
  category: Category;
  /** "tool" for single-tool guides, "editorial" for comparison/guide posts. */
  kind?: "tool" | "editorial";
  /** Editorial posts only: tool ids featured and linked from the post. */
  featuredToolIds?: string[];
  /** SEO title, ~50-60 chars, targets "[tool] online free" or "how to [task]". */
  seoTitle: string;
  /** SEO meta description, 150-160 chars. */
  seoDescription: string;
  /** 2-3 paragraphs: what the tool does and who it is for. */
  intro: string[];
  /**
   * 5-8 numbered how-to steps for tool posts. Editorial posts use
   * sections instead and leave this empty, so no HowTo schema is emitted.
   */
  steps: string[];
  /** 3-5 benefit bullets: why use this tool (key takeaways for editorial). */
  benefits: string[];
  /**
   * Honest processing note. For client-runtime tools: runs in the browser,
   * files/inputs never leave the device. For server-runtime tools: input is
   * sent to complete the request, avoid sensitive information. Never claim
   * a capability the tool does not have.
   */
  privacyNote: string;
  /** 3-4 frequently asked questions with answers. */
  faqs: BlogFaq[];
  /** Editorial posts only: headed body sections rendered after the intro. */
  sections?: BlogSection[];
}

/** True for editorial/comparison posts (no single toolId). */
export function isEditorialPost(post: BlogPost): boolean {
  return post.kind === "editorial" || post.toolId === undefined;
}

/** Approximate word count across all copy fields of a post. */
export function blogPostWordCount(post: BlogPost): number {
  const text = [
    ...post.intro,
    ...post.steps,
    ...post.benefits,
    post.privacyNote,
    ...(post.sections ?? []).flatMap((section) => [
      section.heading,
      ...section.paragraphs,
    ]),
    ...post.faqs.flatMap((faq) => [faq.q, faq.a]),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}
