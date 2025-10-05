"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Wraps the app and syncs `class="dark"` onto <html>.
 * `attribute="class"` means Tailwind's darkMode: 'class' will work.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Avoid hydration mismatch by rendering only after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{children}</>; // render once to avoid FOUC

  return (
    <NextThemes
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="morphai-theme"
    >
      {children}
    </NextThemes>
  );
}
