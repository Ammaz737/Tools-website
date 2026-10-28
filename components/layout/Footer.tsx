import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Quiet Workshop
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--ink-soft)]">
            A private, no-signup toolbox for everyday file, text, developer,
            and calculator tasks.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Browse</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--ink-soft)]">
            <Link href="/tools">All tools</Link>
            <Link href="/category/pdf">PDF tools</Link>
            <Link href="/category/image">Image tools</Link>
            <Link href="/category/developer">Developer tools</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Principles & Legal</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--ink-soft)]">
            <Link href="/about">About Us</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
