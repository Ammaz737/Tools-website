"use client";

import React from "react";

export function PdfPagePreview({
  urls,
  pageCount,
  className = "",
}: {
  urls: string[];
  pageCount?: number;
  className?: string;
}) {
  if (urls.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap justify-center gap-3">
        {urls.map((url, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={`Page ${index + 1} preview`}
            className={`${urls.length === 1 ? "max-h-[600px] w-full max-w-lg" : "h-72 w-auto"} max-w-full rounded-[8px] border border-[var(--line)] bg-white object-contain shadow-sm`}
          />
        ))}
      </div>
      {typeof pageCount === "number" && pageCount > urls.length ? (
        <p className="text-center font-mono text-[11px] text-[var(--ink-faint)]">
          Showing {urls.length} of {pageCount} pages
        </p>
      ) : urls.length === 1 ? (
        <p className="text-center font-mono text-[11px] text-[var(--ink-faint)]">
          Page preview
        </p>
      ) : null}
    </div>
  );
}
