// src/components/AuthPanel.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AuthPanel() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function doRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to register");

      setMsg("Account created. Logging you in…");
      // Auto-login after register
      const login = await signIn("credentials", {
        email,
        password: pw,
        redirect: false,
      });
      if (login?.ok) window.location.replace("/");
      else setMsg("Registered, but auto-login failed. Try logging in.");
    } catch (err: any) {
      setMsg(err?.message || "Failed to register");
    } finally {
      setBusy(false);
    }
  }

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await signIn("credentials", {
        email,
        password: pw,
        redirect: false,
      });
      if (r?.ok) window.location.replace("/");
      else setMsg("Invalid credentials");
    } catch {
      setMsg("Failed to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          className={`btn ${tab === "login" ? "" : "opacity-70"}`}
          onClick={() => setTab("login")}
          type="button"
        >
          Login
        </button>
        <button
          className={`btn ${tab === "register" ? "" : "opacity-70"}`}
          onClick={() => setTab("register")}
          type="button"
        >
          Register
        </button>
      </div>

      {tab === "register" ? (
        <form onSubmit={doRegister} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          </div>
          {msg && <p className="error">{msg}</p>}
          <button className="btn w-full" disabled={busy}>{busy ? "Please wait…" : "Create account"}</button>
        </form>
      ) : (
        <form onSubmit={doLogin} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          </div>
          {msg && <p className="error">{msg}</p>}
          <button className="btn w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      )}
    </div>
  );
}
