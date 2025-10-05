"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Toggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // prevents SSR/client mismatch
    return (
      <div className="h-7 w-12 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
    );
  }

  const isDark = (theme ?? resolvedTheme) === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative h-7 w-12 rounded-full border border-black/10 transition
        ${isDark ? "bg-emerald-500/80" : "bg-white/10"}`}
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white shadow transition-transform
          ${isDark ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}
