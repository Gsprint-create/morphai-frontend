"use client";

import { useMemo } from "react";

type ToolCard = {
  key: string;
  title: string;
  subtitle: string;
  status: "live" | "coming";
  href?: string;
  bullets: string[];
  previewLabel: string;
};

export default function ToolsPage() {
  const tools = useMemo<ToolCard[]>(
    () => [
      {
        key: "faceswap",
        title: "FaceSwap",
        subtitle: "Swap a source face into a target image (private test)",
        status: "live",
        href: "/tools/faceswap",
        previewLabel: "Preview: Source → Target → Result",
        bullets: [
          "Upload source + target images",
          "Auto zoom-to-face (browser FaceDetector)",
          "Download PNG result",
        ],
      },
      {
        key: "genix",
        title: "GeniX",
        subtitle: "AI image generation (placeholder)",
        status: "coming",
        previewLabel: "Preview: Prompt → Styles → Outputs",
        bullets: ["Text-to-image generation", "Style presets", "History & favorites"],
      },
      {
        key: "video",
        title: "Video Tools",
        subtitle: "AI video pipeline (placeholder)",
        status: "coming",
        previewLabel: "Preview: Inputs → Processing → Export",
        bullets: ["Image-to-video", "Clips & transitions", "Export-ready formats"],
      },
      {
        key: "avatars",
        title: "Influencer / Avatars",
        subtitle: "Persona tools (placeholder)",
        status: "coming",
        previewLabel: "Preview: Persona → Looks → Variations",
        bullets: ["Character consistency", "Batch variations", "Brand-ready outputs"],
      },
    ],
    []
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="text-center">
          <h1 className="text-3xl font-semibold">MorphAI Tools</h1>
          <p className="mt-2 text-white/70">
            A preview of what you’ll get inside. Some tools are still coming soon.
          </p>
        </header>

        {/* Wide carousel feel */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white/90">Tool previews</h2>
              <p className="mt-1 text-sm text-white/60">
                Swipe/scroll horizontally. FaceSwap is live for private testing.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-white/50">
              <span className="h-2 w-2 rounded-full bg-white/30" />
              <span>Scroll</span>
              <span className="h-2 w-2 rounded-full bg-white/30" />
              <span>Snap</span>
            </div>
          </div>

          <div className="mt-4 -mx-6 px-6 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-full snap-x snap-mandatory">
              {tools.map((t) => {
                const CardTag: any = t.href ? "a" : "div";
                const isLive = t.status === "live";

                return (
                  <CardTag
                    key={t.key}
                    href={t.href}
                    className={[
                      "snap-start",
                      "w-[88%] sm:w-[70%] md:w-[520px]",
                      "shrink-0",
                      "rounded-2xl border border-white/10 bg-white/5",
                      "p-5",
                      "transition",
                      t.href ? "hover:bg-white/10" : "opacity-70",
                    ].join(" ")}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-white">{t.title}</h3>

                          {isLive ? (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                              Live
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                              Coming soon
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-white/60">{t.subtitle}</p>
                      </div>

                      {t.href ? (
                        <div className="rounded-xl bg-blue-500/20 px-3 py-2 text-xs text-blue-200 border border-blue-500/20">
                          Open →
                        </div>
                      ) : (
                        <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/50 border border-white/10">
                          Preview
                        </div>
                      )}
                    </div>

                    {/* Preview strip (placeholders) */}
                    <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      <div className="p-3 border-b border-white/10">
                        <div className="text-xs text-white/60">{t.previewLabel}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="aspect-[4/3] rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-transparent"
                          >
                            <div className="h-full w-full flex items-center justify-center text-[11px] text-white/40">
                              Image placeholder
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What you get */}
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-white/80">What you’ll get inside</div>
                      <ul className="mt-2 space-y-1 text-sm text-white/65">
                        {t.bullets.map((b, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/35" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA bottom */}
                    {t.href ? (
                      <div className="mt-5">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                          Click to open <span className="text-white/90 font-medium">{t.title}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50">
                          This tool is not live yet.
                        </div>
                      </div>
                    )}
                  </CardTag>
                );
              })}
            </div>
          </div>
        </section>

        {/* Simple grid (optional quick access) */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-white/90">Quick tiles</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <a
              href="/tools/faceswap"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
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
        </section>

        <footer className="mt-10 text-center text-xs text-white/40">
          Tip: Keep FaceSwap private until launch by gating /tools behind a secret route or login.
        </footer>
      </div>
    </main>
  );
}
