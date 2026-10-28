"use client";

import { useEffect, useSyncExternalStore } from "react";

const storageKey = "quiet-workshop-theme";

type Theme = "light" | "dark";

function readStoredTheme(): Theme {
  const stored = window.localStorage.getItem(storageKey) as Theme | null;

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const themeEvent = "quiet-workshop-theme-change";
function subscribeTheme(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(themeEvent, listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(themeEvent, listener);
    media.removeEventListener("change", listener);
  };
}
const serverTheme = (): Theme | null => null;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readStoredTheme, serverTheme);
  useEffect(() => {
    if (theme) document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    const nextTheme = readStoredTheme() === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, nextTheme);
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)]"
      aria-label="Toggle color theme"
      suppressHydrationWarning
    >
      {!theme ? "Theme" : theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
