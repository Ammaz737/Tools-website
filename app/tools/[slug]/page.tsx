import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { buildToolMetadata, isToolIndexable } from "@/lib/seo";
import { tools } from "@/lib/tools";
import { ToolShell } from "@/components/ui/ToolShell";
import { ToolDispatcher } from "@/tools";
import { generateToolJsonLd } from "@/lib/jsonld";
import { pdfToolContent } from "@/lib/pdf-tool-content";
import {
  getPublicToolById,
  getRelatedPublicTools,
} from "@/lib/public-tools";

export const dynamic = "force-dynamic";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.id }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getPublicToolById(slug);

  return tool ? buildToolMetadata(tool) : {};
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = await getPublicToolById(slug);

  if (!tool) {
    notFound();
  }

  const related = await getRelatedPublicTools(tool);
  const jsonLd = generateToolJsonLd(tool);
  const content = pdfToolContent[tool.id];

  return (
    <>
      {isToolIndexable(tool) && <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />}
      <ToolShell
        tool={tool}
        usageCount={tool.usageCount}
        relatedTools={related}
        aboutText={content?.aboutText}
        steps={content?.steps}
        faqs={content?.faqs}
      >
        <ToolDispatcher tool={{ id: tool.id, name: tool.name, category: tool.category }} />
      </ToolShell>
    </>
  );
}
