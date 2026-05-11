"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("next") || "/tools";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErr(j?.detail || "Login failed.");
        return;
      }

      router.replace(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1d4ed833,transparent_35%),radial-gradient(circle_at_bottom,#7c3aed22,transparent_35%)]" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-blue-500/20">
            <span className="text-xl font-black">M</span>
          </div>

          <p className="text-xs uppercase tracking-[0.35em] text-blue-300/80">
            Vionix Platform
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Welcome back
          </h1>

          <p className="mt-3 text-sm text-white/60">
            Enter MorphAI and continue your work.
          </p>
        </div>

        {err && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {err}
          </div>
        )}

        <form
          onSubmit={submit}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <div className="space-y-4">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-violet-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </div>

          <div className="mt-5 text-center">
            <a
              className="text-xs text-white/55 transition hover:text-white"
              href="/auth/signup"
            >
              No account? Create one →
            </a>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-white/35">
          Vionix → MorphAI Tools
        </p>
      </div>
    </main>
  );
}