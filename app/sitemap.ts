import type { MetadataRoute } from "next";

import { categories } from "@/lib/tools";
import { getPublicTools } from "@/lib/public-tools";
import { siteOrigin } from "@/lib/site-config";
import { isToolIndexable } from "@/lib/seo";
import { blogPosts } from "@/lib/blog-posts";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const now = new Date();
  const publicTools = (await getPublicTools()).filter(isToolIndexable);

  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/tools`, lastModified: now, priority: 0.9 },
    ...categories
      .filter((category) => publicTools.some((tool) => tool.category === category))
      .map((category) => ({
        url: `${base}/category/${category}`,
        lastModified: now,
        priority: 0.8,
      })),
    ...publicTools.map((tool) => ({
      url: `${base}/tools/${tool.id}`,
      lastModified: now,
      priority: 0.7,
    })),
    { url: `${base}/blog`, lastModified: now, priority: 0.5 },
    ...blogPosts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
