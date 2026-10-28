import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";
import { buildSiteMetadata } from "@/lib/seo";

import "./globals.css";

// Only preload the primary body font. Display/mono are used selectively,
// so preloading them triggers Chrome's "preloaded but not used" warning.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

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
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body
        className={`${body.className} min-h-full bg-[var(--bg)] text-[var(--ink)]`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='quiet-workshop-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
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
