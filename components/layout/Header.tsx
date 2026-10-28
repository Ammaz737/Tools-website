import Link from "next/link";

const navItems = [
  { href: "/category/pdf", label: "PDF" },
  { href: "/category/image", label: "Image" },
  { href: "/category/developer", label: "Developer" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="min-w-0">
          <span className="block text-xl font-bold tracking-tight text-[var(--ink)]">
            Quiet Workshop
          </span>
          <span className="block text-xs text-[var(--ink-soft)]">
            137 free tools, no signup
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/tools"
            className="hidden rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:block"
          >
            All tools
          </Link>
        </div>
      </div>
    </header>
  );
}
