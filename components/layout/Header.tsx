"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, LayoutGrid } from "lucide-react";
import { categories, categoryMeta } from "@/lib/tools";
import { getCategoryIcon } from "@/components/tool-cards/categoryIcon";
import { BrandLogo } from "./BrandLogo";

export function Header() {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        menuRef.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="ALETOOL home">
          <BrandLogo preload />
        </Link>
        <details
          ref={menuRef}
          className="nav-menu"
          onKeyDown={(event) => {
            if (event.key === "Escape" && menuRef.current) {
              menuRef.current.open = false;
              menuRef.current.querySelector("summary")?.focus();
            }
          }}
        >
          <summary>
            <LayoutGrid size={17} />
            <span>Tools</span>
            <ChevronDown size={14} className="menu-chevron" />
          </summary>
          <div
            className="mega-menu"
            onClick={(event) => {
              if ((event.target as Element).closest("a") && menuRef.current)
                menuRef.current.open = false;
            }}
          >
            <div className="mega-heading">
              <span>A tool for every task</span>
              <Link href="/tools">
                View all tools <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mega-grid">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category);
                const meta = categoryMeta[category];
                return (
                  <Link key={category} href={`/category/${category}`}>
                    <span
                      className="mega-icon"
                      style={{
                        color: meta.accent,
                        background: `${meta.accent}12`,
                      }}
                    >
                      <Icon size={20} />
                    </span>
                    <span>
                      <strong>{meta.name}</strong>
                      <small>{meta.description}</small>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </details>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/tools/compress-pdf">Compress</Link>
          <Link href="/tools/merge-pdf">Merge</Link>
          <Link href="/tools/edit-pdf">Edit</Link>
          <Link href="/category/image">Image</Link>
          <Link href="/category/ai">AI tools</Link>
        </nav>
        <div className="header-actions">
          <Link href="/blog" className="header-guide">
            How-to guides
          </Link>
          <Link
            href="/tools"
            className="site-button site-button-primary header-cta"
          >
            All tools <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
