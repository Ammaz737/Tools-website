import type { BlogPost } from "./blog";
import { aiPosts } from "./blog/ai";
import { calculatorsPosts } from "./blog/calculators";
import { convertersPosts } from "./blog/converters";
import { developerPosts } from "./blog/developer";
import { imagePosts } from "./blog/image";
import { pdfPosts } from "./blog/pdf";
import { securityPosts } from "./blog/security";
import { seoPosts } from "./blog/seo";
import { textPosts } from "./blog/text";
import { utilitiesPosts } from "./blog/utilities";
import { editorialPosts } from "./blog/editorial";
import { categories, categoryMeta, type Category } from "./tools";

export const blogPosts: BlogPost[] = [
  ...pdfPosts,
  ...imagePosts,
  ...aiPosts,
  ...textPosts,
  ...developerPosts,
  ...seoPosts,
  ...securityPosts,
  ...convertersPosts,
  ...calculatorsPosts,
  ...utilitiesPosts,
  ...editorialPosts,
];

/** Editorial / comparison posts only (no single toolId). */
export function getEditorialBlogPosts(): BlogPost[] {
  return editorialPosts;
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogPostsByCategory(category: Category): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

export function getRelatedBlogPosts(post: BlogPost, limit = 4): BlogPost[] {
  const sameCategory = blogPosts.filter(
    (entry) => entry.category === post.category && entry.slug !== post.slug,
  );
  const others = blogPosts.filter(
    (entry) => entry.category !== post.category && entry.slug !== post.slug,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export function getBlogPostsGroupedByCategory(): Array<{
  category: Category;
  name: string;
  description: string;
  posts: BlogPost[];
}> {
  return categories.map((category) => ({
    category,
    name: categoryMeta[category].name,
    description: categoryMeta[category].description,
    posts: getBlogPostsByCategory(category),
  }));
}
