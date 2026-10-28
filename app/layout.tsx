import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";
import { buildSiteMetadata } from "@/lib/seo";

import "./globals.css";

// Headings share the Inter body font (SmallPDF-style clean sans), so no
// separate display font is loaded. --font-display maps to --font-body
// in globals.css, keeping every existing font-display usage working.
const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = buildSiteMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body
        className={`${body.className} min-h-full bg-[var(--bg)] text-[var(--ink)]`}
      >
        <ToastProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
