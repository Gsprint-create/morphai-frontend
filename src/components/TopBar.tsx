"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function TopBar({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href ? "text-white" : "text-white/70 hover:text-white";

  return (
    <div className="sticky top-0 z-50 bg-[var(--card)]/80 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-white">MorphAI</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className={isActive("/")}>Home</Link>
            <Link href="/swap" className={isActive("/swap")}>Face Swap</Link>
            {/* add more links if needed */}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden sm:block text-xs text-white/70">
              {email}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn h-8 px-3 text-sm"
            aria-label="Sign out"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
