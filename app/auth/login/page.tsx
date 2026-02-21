import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="h-8 w-40 rounded bg-white/10" />
        <div className="mt-3 h-4 w-60 rounded bg-white/10" />
        <div className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="h-10 w-full rounded-xl bg-white/10" />
          <div className="h-10 w-full rounded-xl bg-white/10" />
          <div className="h-10 w-full rounded-xl bg-white/10" />
        </div>
      </div>
    </main>
  );
}