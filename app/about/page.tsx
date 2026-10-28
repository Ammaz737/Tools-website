import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Universal Web Tools",
  description: "Learn about Universal Web Tools and its approach to everyday tasks and privacy.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">About Universal Web Tools</h1>
        <p className="text-sm text-[var(--ink-soft)] font-mono">Everyday tools for developers, creators, and professionals.</p>
      </div>

      <div className="text-sm text-[var(--ink)] space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Our Mission</h2>
          <p>
            Universal Web Tools brings document, image, text and calculation tasks together in a simple workspace.
            Each tool explains its available features and privacy considerations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Using the toolbox</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Choose a tool, provide the requested input, and review the result before using it.</li>
            <li>Tools marked coming soon are not available yet.</li>
            <li>Review each tool&apos;s privacy notice before entering sensitive information.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
