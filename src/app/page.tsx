import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=%2F");

  return (
    <main className="w-full max-w-xl space-y-4">
      <h1 className="text-3xl font-bold text-center">MorphAI</h1>
      <p className="text-center opacity-80">
        Welcome back! Open the tool to start a face swap.
      </p>

      <div className="card space-y-3">
        <h2 className="text-xl font-semibold text-center">Face Swap</h2>
        <p className="text-center opacity-80">
          Upload a source face and a target image. We’ll handle the rest.
        </p>
        <div className="flex justify-center">
          <Link href="/swap" className="btn">Open Tool</Link>
        </div>
      </div>
    </main>
  );
}
