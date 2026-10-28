import type { Tool } from "./tools";
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
