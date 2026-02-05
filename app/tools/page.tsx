export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold mb-6">MorphAI Tools</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <a href="/tools/faceswap" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
          <div className="text-sm font-semibold">FaceSwap</div>
          <div className="mt-2 text-sm text-white/60">Swap faces (private test)</div>
        </a>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 opacity-60">
          <div className="text-sm font-semibold">GeniX</div>
          <div className="mt-2 text-sm text-white/60">Coming soon</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 opacity-60">
          <div className="text-sm font-semibold">Video Tools</div>
          <div className="mt-2 text-sm text-white/60">Coming soon</div>
        </div>
      </div>
    </main>
  );
}
