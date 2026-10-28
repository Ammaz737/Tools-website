import type { MetadataRoute } from "next";

import { categories } from "@/lib/tools";
import { getPublicTools } from "@/lib/public-tools";
import { siteOrigin } from "@/lib/site-config";
import { isToolIndexable } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const publicTools = (await getPublicTools()).filter(isToolIndexable);

  return [
    { url: `${base}/` },
    { url: `${base}/tools` },
    ...categories.filter((category) => publicTools.some((tool) => tool.category === category)).map((category) => ({ url: `${base}/category/${category}` })),
    ...publicTools.map((tool) => ({ url: `${base}/tools/${tool.id}` })),
  ];
}
