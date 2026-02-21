"use client";

const tools = [
  {
    key: "faceswap",
    name: "FaceSwap",
    status: "Live",
    desc: "Swap faces with a clean workflow: upload source + target, get a result you can download.",
    bullets: [
      "Fast single-swap flow",
      "High-quality output (PNG)",
      "Private testing gate (only you)",
    ],
    href: "/tools/faceswap",
    live: true,
    gradient: "from-blue-500/20 via-cyan-400/10 to-transparent",
  },
  {
  key: "genix",
  name: "Genix",
  status: "Live",
  desc: "Generate an image from a prompt with style presets. Download your result as PNG.",
  bullets: [
    "Prompt + style presets",
    "High-quality PNG output",
    "Private testing gate (only you)",
  ],
  href: "/tools/genix",
  live: true,
  gradient: "from-purple-500/20 via-fuchsia-400/10 to-transparent",
},
  {
    key: "video",
    name: "Video Tools",
    status: "Coming soon",
    desc: "Video-focused creation tools that plug into the same MorphAI hub.",
    bullets: ["Simple workflows", "Creator-first UI", "More tools soon"],
    href: "#",
    live: false,
    gradient: "from-emerald-500/20 via-teal-400/10 to-transparent",
  },
];

function PreviewBlock({ label }: { label: string }) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {/* Decorative glow */}
      <div className="absolute inset-0 opacity-80">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Placeholder content */}
      <div className="relative flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="text-xs font-semibold tracking-wide text-white/60">
            PREVIEW
          </div>
          <div className="mt-2 text-sm text-white/80">{label}</div>
          <div className="mt-1 text-xs text-white/50">
            (placeholder image)
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold">MorphAI Tools</h1>
          <p className="mt-2 text-sm text-white/60">
            A quick overview of what you’ll get inside MorphAI. Tools shown below
            are previews — not all are live yet.
          </p>
        </div>

        {/* Stacked tool sections */}
        <div className="space-y-6">
          {tools.map((t) => (
            <section
              key={t.key}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
            >
              {/* Background wash */}
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${t.gradient}`}
              />

              <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
                {/* Preview */}
                <PreviewBlock label={`${t.name} Preview`} />

                {/* Copy */}
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold">{t.name}</h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        t.live
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                          : "bg-white/5 text-white/60 border border-white/10"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    {t.desc}
                  </p>

                  <ul className="mt-4 space-y-2 text-sm text-white/70">
                    {t.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {t.live ? (
                      <a
                        href={t.href}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
                      >
                        Open {t.name} →
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/40"
                        title="Coming soon"
                      >
                        Coming soon
                      </button>
                    )}

                    <a
                      href="/"
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/80 hover:bg-white/10 transition"
                    >
                      Back to Home
                    </a>
                  </div>

                  {t.live && (
                   
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 text-xs text-white/40">
          Created by Human powered by AI.
        </div>
      </div>
    </main>
  );
}
