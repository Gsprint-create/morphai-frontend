// src/app/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl card space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">MorphAI</h1>
          <div className="text-sm opacity-70">
            Signed in as <span className="font-medium">{session.user?.email}</span>
          </div>
        </header>

        <div className="space-y-4">
          {/* Put your swap UI component here */}
          <p className="text-sm opacity-80">
            Welcome! Your account is active—drop in your source & target images to start swapping.
          </p>
        </div>
      </div>
    </main>
  );
}
