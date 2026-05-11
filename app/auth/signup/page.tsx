"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, email, password }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErr(j?.detail || "Signup failed.");
        return;
      }

      router.replace("/tools");
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
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-xl font-black text-transparent">
              M
            </span>
          </div>

          <p className="text-xs uppercase tracking-[0.35em] text-blue-300/80">
            Vionix Platform
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Create account
          </h1>

          <p className="mt-3 text-sm text-white/60">
            Join MorphAI and start using your AI tools.
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
              placeholder="Name (optional)"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

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
              placeholder="Password (min 8 chars)"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-violet-500 hover:shadow-xl hover:shadow-blue-500/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </div>

          <div className="mt-5 text-center">
            <a
              className="text-xs text-white/55 transition hover:text-white"
              href="/auth/login"
            >
              Already have an account? Login →
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