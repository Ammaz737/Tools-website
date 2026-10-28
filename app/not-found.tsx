import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-start justify-center px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
        404
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--ink)]">
        That shelf is empty.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
        The page you asked for does not exist yet. Try the full tool list or
        jump to one of the main categories.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/tools"
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
        >
          Browse all tools
        </Link>
        <Link
          href="/category/pdf"
          className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm text-[var(--ink)]"
        >
          PDF tools
        </Link>
      </div>
    </div>
  );
}
