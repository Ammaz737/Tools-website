import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | ALETOOL",
  description: "Read the Terms of Service and acceptable use policy for ALETOOL.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Terms of Service</h1>
        <p className="text-sm text-[var(--ink-soft)] font-mono">Last Updated: July 28, 2026</p>
      </div>

      <div className="text-sm text-[var(--ink)] space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--ink)]">1. Acceptance of Terms</h2>
          <p>
            By accessing and using ALETOOL, you agree to comply with and be bound by these Terms of Service. If you do not agree, please refrain from using the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--ink)]">2. Acceptable Use</h2>
          <p>
            You agree to use the tools only for lawful purposes. You must not use network diagnostic tools (such as DNS, SSL, or WHOIS lookups) to perform unauthorized scanning or malicious activities.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--ink)]">3. Disclaimer of Warranties</h2>
          <p>
            All tools and services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied. While we strive for accuracy, users are encouraged to verify critical calculated outputs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--ink)]">4. Limitation of Liability</h2>
          <p>
            In no event shall ALETOOL be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our tools.
          </p>
        </section>
      </div>
    </div>
  );
}
