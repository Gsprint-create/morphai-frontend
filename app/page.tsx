import { redirect } from "next/navigation";

  redirect("/auth/login");
}
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">MorphAI</h1>
        <p className="text-white/70">Tool hub</p>

        <a
          href="/tools"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500"
        >
          Login →
        </a>
      </div>
    </main>
  );
}
