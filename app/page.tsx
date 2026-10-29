import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileText,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { ToolExplorer, ToolSearch } from "@/components/home/ToolExplorer";
import { WorkspaceIllustration } from "@/components/home/WorkspaceIllustration";
import { CategoryCard } from "@/components/tool-cards/CategoryCard";
import { ToolCard } from "@/components/tool-cards/ToolCard";
import { categories } from "@/lib/tools";
import { languageAlternates, ogImageUrl } from "@/lib/seo";
import { generateWebSiteJsonLd } from "@/lib/jsonld";
import {
  getPublicCategoryCounts,
  getPublicFeaturedTools,
  getPublicNewTools,
  getPublicTools,
} from "@/lib/public-tools";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const path = "/";
  const ogImage = ogImageUrl(
    "137 Free Online Tools, No Signup",
    "PDF, image, AI, text, developer, SEO, security, converter, calculator & utility tools.",
  );
  return {
    robots: { index: true, follow: true },
    title: {
      absolute:
        "Free Online Tools — PDF, Image, AI & More | ALETOOL",
    },
    description:
      "137 free online tools: merge, split, and compress PDFs, convert images, check AI writing, calculate loans, and more. No signup, no watermark. Most tools run in your browser.",
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
    openGraph: {
      title: "Free Online Tools — PDF, Image, AI & More",
      description:
        "137 free online tools with no signup: PDF, image, AI, text, developer, SEO, security, converter, calculator, and utility tools.",
      type: "website",
      url: path,
      locale: "en_US",
      siteName: "ALETOOL",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "ALETOOL — 137 Free Online Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Free Online Tools — PDF, Image, AI & More",
      description:
        "137 free online tools with no signup: PDF, image, AI, text, developer, SEO, security, converter, calculator, and utility tools.",
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  const [featured, recent, publicTools, categoryCounts] = await Promise.all([
    getPublicFeaturedTools(12),
    getPublicNewTools(3),
    getPublicTools(),
    getPublicCategoryCounts(),
  ]);
  const webSiteLd = generateWebSiteJsonLd();
  return (
    <div className="homepage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webSiteLd).replace(/</g, "\\u003c"),
        }}
      />
      <section className="home-hero page-container">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span /> Your everyday digital toolbox
          </div>
          <h1>
            Less busywork.
            <br />
            <span>More possibilities.</span>
          </h1>
          <p className="hero-description">
            Make light work of PDFs, images, text, and more. Simple tools that
            get you from to-do to done.
          </p>
          <div className="hero-actions">
            <Link href="/tools" className="site-button site-button-primary">
              Explore all tools <ArrowRight size={18} />
            </Link>
            <Link
              href="/category/pdf"
              className="site-button site-button-outline"
            >
              <FileText size={18} /> Browse PDF tools
            </Link>
          </div>
          <div className="hero-trust">
            <span>
              <Check size={15} /> Free to use
            </span>
            <span>
              <Check size={15} /> No signup
            </span>
            <span>
              <Check size={15} /> No watermark
            </span>
          </div>
          <ToolSearch tools={publicTools} />
        </div>
        <WorkspaceIllustration />
      </section>

      <div className="benefits-strip">
        <div className="page-container benefits-inner">
          <span>
            <LayoutIcon /> <strong>{publicTools.length} tools.</strong> One
            happy workflow.
          </span>
          <span>
            <ShieldCheck size={18} /> Local processing where possible
          </span>
          <span>
            <Zap size={18} /> Open a tool. Get it done.
          </span>
        </div>
      </div>

      <section className="home-section page-container" id="popular-tools">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">LESS EFFORT. BETTER RESULTS.</p>
            <h2>Your next task, sorted.</h2>
            <p>The tools you reach for, ready when you need them.</p>
          </div>
          <Link href="/tools" className="text-link">
            View all tools <ArrowRight size={17} />
          </Link>
        </div>
        <ToolExplorer
          tools={publicTools}
          featuredIds={featured.map((tool) => tool.id)}
        />
      </section>

      <section className="category-section">
        <div className="page-container home-section">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">FIND YOUR FLOW</p>
              <h2>A little help for every kind of work.</h2>
              <p>Pick a category. Find the right tool. Keep moving.</p>
            </div>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <CategoryCard
                key={category}
                category={category}
                count={categoryCounts[category]}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section page-container workflow-section">
        <div className="workflow-copy">
          <p className="section-eyebrow">BUILT TO BE SIMPLE</p>
          <h2>
            Three steps.
            <br />
            One thing off your list.
          </h2>
          <p>
            No manuals, no complicated menus. Just a clear path from your file
            to your finished result.
          </p>
          <Link href="/tools" className="text-link">
            Find your tool <ArrowRight size={17} />
          </Link>
        </div>
        <div className="workflow-steps">
          {[
            {
              icon: Upload,
              title: "Bring your file or idea",
              text: "Choose a file, drop it in, or paste your text. Start with what you have.",
            },
            {
              icon: MousePointer2,
              title: "Make it yours",
              text: "Use the settings you need. Simple defaults take care of the rest.",
            },
            {
              icon: Download,
              title: "Done. And ready to go.",
              text: "Check your result, then download or copy it. Straight back to your day.",
            },
          ].map((step, index) => (
            <div className="workflow-step" key={step.title}>
              <span className="step-icon">
                <step.icon size={22} />
              </span>
              <div>
                <span className="step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-container">
        <div className="privacy-feature">
          <div className="privacy-art" aria-hidden="true">
            <div className="privacy-orbit orbit-one" />
            <div className="privacy-orbit orbit-two" />
            <span>
              <ShieldCheck size={62} strokeWidth={1.3} />
            </span>
            <i className="privacy-check">
              <Check size={20} />
            </i>
          </div>
          <div>
            <p className="section-eyebrow">YOUR WORK IS YOURS</p>
            <h2>
              A simpler workflow.
              <br />A thoughtful approach to privacy.
            </h2>
            <p>
              Many tools process files right in your browser. When a tool needs
              an online service, we tell you before you start.
            </p>
            <Link href="/privacy" className="text-link">
              How we handle your data <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="home-section page-container">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">MEET YOUR NEXT FAVORITE</p>
              <h2>Fresh in the workshop.</h2>
            </div>
            <Sparkles size={24} className="text-[var(--accent)]" />
          </div>
          <div className="recent-grid">
            {recent.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      <section className="page-container home-cta-wrap">
        <div className="home-cta">
          <span className="cta-icon">
            <CheckCircle2 size={30} />
          </span>
          <h2>Good tools. Less friction.</h2>
          <p>Your next task is a little easier from here.</p>
          <Link href="/tools" className="site-button site-button-primary">
            Find the right tool <ArrowRight size={18} />
          </Link>
          <span className="cta-note">Free to use. No account needed.</span>
        </div>
      </section>
    </div>
  );
}

function LayoutIcon() {
  return (
    <span className="mini-grid" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
