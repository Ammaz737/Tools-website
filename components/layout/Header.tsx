import Link from "next/link";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/tools", label: "All tools" },
  { href: "/category/pdf", label: "PDF" },
  { href: "/category/image", label: "Image" },
  { href: "/category/developer", label: "Developer" },
];

export function Header() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="min-w-0">
          <span className="block font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Quiet Workshop
          </span>
          <span className="block text-sm text-[var(--ink-soft)]">
            137 small tools, built with care
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-4 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
