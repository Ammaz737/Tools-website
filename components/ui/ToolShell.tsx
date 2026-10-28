import React from "react";
import Link from "next/link";
import { Tool, getRelatedTools } from "@/lib/tools";
import { Breadcrumbs } from "./Breadcrumbs";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { AdSlot } from "@/components/layout/AdSlot";
import { ToolCard } from "@/components/tool-cards/ToolCard";
import { ToolUsageBadge } from "@/components/tools/ToolUsageBadge";
import { ShieldCheck, Cpu, Zap, Lock } from "lucide-react";

export interface ToolStep {
  title: string;
  description: string;
}

export interface ToolFAQ {
  question: string;
  answer: string;
}

export interface ToolShellProps {
  tool: Tool;
  children: React.ReactNode;
  aboutText?: string;
  steps?: ToolStep[];
  faqs?: ToolFAQ[];
  usageCount?: number;
  relatedTools?: Array<Tool & { usageCount?: number }>;
}

export const ToolShell: React.FC<ToolShellProps> = ({
  tool,
  children,
  aboutText,
  steps,
  faqs,
  usageCount = 0,
  relatedTools,
}) => {
  const related = relatedTools ?? getRelatedTools(tool);

  const trustNotice =
    ["word-to-pdf", "excel-to-pdf", "powerpoint-to-pdf"].includes(tool.id)
      ? "Browser conversion stays on this device. Choosing the server option uploads your document."
      : tool.runtime === "client"
      ? "Your input stays on this device for this operation."
      : "Your input is sent to complete this request. Avoid submitting sensitive information.";

  const defaultSteps: ToolStep[] = steps || [
    {
      title: "Select or input data",
      description: "Upload your files or paste your text into the workspace above.",
    },
    {
      title: "Adjust settings (optional)",
      description: "Choose your options or preview parameters in real time.",
    },
    {
      title: "Get instant result",
      description: "Download the generated output file or copy the result to your clipboard.",
    },
  ];

  const defaultFaqs: ToolFAQ[] = faqs || [
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
      answer: "Yes, every tool in our workshop is optimized for smartphones, tablets, and desktop computers.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: tool.category, href: `/category/${tool.category}` },
          { label: tool.name },
        ]}
      />

      {/* Tool Header */}
      <header className="mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="accent">{tool.category}</Badge>
          <ToolUsageBadge
            key={tool.id}
            toolId={tool.id}
            initialCount={usageCount}
          />
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold tracking-tight text-[var(--ink)]">
          {tool.name}
        </h1>

        <p className="mt-3 text-lg leading-relaxed text-[var(--ink-soft)]">
          {tool.blurb}
        </p>

        <div className="mt-4 flex items-center gap-2.5 rounded-[10px] border border-[var(--line)] bg-[var(--surface-sunk)] px-4 py-2.5 text-xs text-[var(--ink-soft)]">
          <ShieldCheck className="w-4 h-4 text-[var(--success)] shrink-0" />
          <span>{trustNotice}</span>
        </div>
      </header>

      {/* Ad Slot Top */}
      <div className="mt-8">
        <AdSlot label="Ad slot: tool top" />
      </div>

      {/* Main Workspace Surface */}
      <main className="mt-8">{children}</main>

      {/* Ad Slot Middle */}
      <div className="mt-10">
        <AdSlot label="Ad slot: tool middle" />
      </div>

      {/* Info & FAQ Grid */}
      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        {/* About & Trust Bullets */}
        <Card variant="surface" className="p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            About {tool.name}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
            {aboutText ||
              `${tool.name} is a fast, privacy-focused utility designed to handle your workflow cleanly with zero account creation or registration.`}
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 text-xs text-[var(--ink-soft)]">
              <Zap className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <span>Adjust the options and review your result before downloading.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-[var(--ink-soft)]">
              <Lock className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
              <span>See our privacy policy for input handling and usage information.</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-[var(--ink-soft)]">
              <Cpu className="w-4 h-4 text-[var(--focus)] shrink-0 mt-0.5" />
              <span>Use a modern browser. Availability and performance depend on your device and the selected tool.</span>
            </div>
          </div>
        </Card>

        {/* How to use */}
        <Card variant="surface" className="p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            How to use {tool.name}
          </h2>
          <ol className="mt-4 space-y-4">
            {defaultSteps.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-mono text-xs font-bold text-[var(--accent)]">
                  {idx + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    {step.title}
                  </span>
                  <span className="text-xs text-[var(--ink-soft)] mt-0.5">
                    {step.description}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
          Frequently Asked Questions
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {defaultFaqs.map((faq, idx) => (
            <Card key={idx} variant="sunk" className="p-5">
              <h3 className="text-sm font-bold text-[var(--ink)]">
                {faq.question}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">
                {faq.answer}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Related Tools */}
      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
              Related {tool.category} tools
            </h2>
            <Link
              href={`/category/${tool.category}`}
              className="text-xs font-medium text-[var(--accent)] hover:underline"
            >
              View all {tool.category} tools →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((relTool) => (
              <ToolCard
                key={relTool.id}
                tool={relTool}
                usageCount={
                  "usageCount" in relTool && typeof relTool.usageCount === "number"
                    ? relTool.usageCount
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
