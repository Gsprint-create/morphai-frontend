// src/app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RegisterResponse = { ok?: boolean; error?: string };

export default function RegisterPage() {
  const r = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: RegisterResponse = {};
      try {
        // Safe parse without `any`
        data = (await res.json()) as RegisterResponse;
      } catch {
        // non-JSON response; fall back to status
      }

      if (res.ok) {
        setMsg("Account created! Redirecting…");
        setTimeout(() => r.push("/login"), 800);
      } else {
        setMsg(data.error ?? "Failed to register");
      }
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Create account</h1>

        <input name="name" placeholder="Name" className="input" />
        <input name="email" type="email" placeholder="Email" className="input" required />
        <input name="password" type="password" placeholder="Password (min 6)" className="input" required />

        <button disabled={busy} className="btn w-full">
          {busy ? "Creating..." : "Register"}
        </button>

        {msg && <p className="text-sm text-center">{msg}</p>}

        <p className="text-sm text-center text-[var(--muted)]">
          Already have an account? <a className="underline" href="/login">Log in</a>
        </p>
      </form>
    </main>
  );
}
