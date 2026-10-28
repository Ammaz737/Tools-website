import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto bg-[#0f2040] text-slate-300">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="text-xl font-bold tracking-tight text-white">
            Quiet Workshop
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
            A private, no-signup toolbox for everyday file, text, developer,
            and calculator tasks.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Browse</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link href="/tools" className="transition-colors hover:text-white">
              All tools
            </Link>
            <Link href="/blog" className="transition-colors hover:text-white">
              Blog
            </Link>
            <Link
              href="/category/pdf"
              className="transition-colors hover:text-white"
            >
              PDF tools
            </Link>
            <Link
              href="/category/image"
              className="transition-colors hover:text-white"
            >
              Image tools
            </Link>
            <Link
              href="/category/developer"
              className="transition-colors hover:text-white"
            >
              Developer tools
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Principles & Legal</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link href="/about" className="transition-colors hover:text-white">
              About Us
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-7xl px-4 py-5 text-xs text-slate-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Quiet Workshop · 137 free tools, no
          signup, no watermark.
        </p>
      </div>
    </footer>
  );
}
