"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/";
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      redirect: false,
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      callbackUrl,
    });
    if (res?.ok) r.push(callbackUrl);
    else setMsg(res?.error || "Invalid credentials");
    setBusy(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Log in</h1>
        <input name="email" type="email" placeholder="Email" className="input" required />
        <input name="password" type="password" placeholder="Password" className="input" required />
        <button disabled={busy} className="btn w-full">{busy ? "Signing in..." : "Log in"}</button>
        {msg && <p className="text-sm text-center text-red-300">{msg}</p>}
        <p className="text-sm text-center text-[var(--muted)]">
          No account? <a className="underline" href="/register">Register</a>
        </p>
      </form>
    </main>
  );
}
