import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-main">
        <div className="footer-brand">
          <Link href="/" className="brand" aria-label="ALETOOL home">
            <BrandLogo />
          </Link>
          <p className="footer-description">
            A little less busywork. A little more time for what matters. Simple
            tools for your everyday.
          </p>
        </div>
        <div className="footer-column">
          <h3>Explore tools</h3>
          <Link href="/category/pdf">PDF tools</Link>
          <Link href="/category/image">Image tools</Link>
          <Link href="/category/text">Text tools</Link>
          <Link href="/category/developer">Developer tools</Link>
          <Link href="/tools">All tools</Link>
        </div>
        <div className="footer-column">
          <h3>More possibilities</h3>
          <Link href="/category/ai">AI writing</Link>
          <Link href="/category/calculators">Calculators</Link>
          <Link href="/category/converters">Converters</Link>
          <Link href="/category/security">Security tools</Link>
          <Link href="/category/utilities">Everyday utilities</Link>
        </div>
        <div className="footer-column">
          <h3>The workshop</h3>
          <Link href="/about">About us</Link>
          <Link href="/blog">How-to guides</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms of service</Link>
        </div>
      </div>
      <div className="page-container footer-bottom">
        <span>
          © {new Date().getFullYear()} ALETOOL. Made for your everyday.
        </span>
        <span className="footer-local">
          <ShieldCheck size={13} /> No signup. No watermark. Less friction.
        </span>
      </div>
    </footer>
  );
}
