"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://morphai-production-9b8f.up.railway.app";

type SizeOpt = { key: "1024x1024" | "1024x1536" | "1536x1024"; label: string; hint: string };

const SIZES: SizeOpt[] = [
  { key: "1024x1024", label: "Square", hint: "1:1" },
  { key: "1024x1536", label: "Portrait", hint: "2:3" },
  { key: "1536x1024", label: "Landscape", hint: "3:2" },
];

const PRESETS = [
  { key: "none", label: "None", add: "" },
  { key: "realistic", label: "Realistic", add: "photorealistic, natural skin texture, high detail" },
  { key: "cinematic", label: "Cinematic", add: "cinematic lighting, film still, depth of field" },
  { key: "portrait", label: "Portrait", add: "studio portrait, soft key light, sharp eyes" },
  { key: "product", label: "Product", add: "product photo, clean background, crisp, commercial lighting" },
  { key: "anime", label: "Anime", add: "anime style, clean lineart, vibrant" },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"];

export default function GenixPage() {
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<PresetKey>("realistic");
  const [size, setSize] = useState<SizeOpt["key"]>("1024x1024");

  const [isGenerating, setIsGenerating] = useState(false);
  const canGenerate = !isGenerating && prompt.trim().length >= 3;
  const [error, setError] = useState<string | null>(null);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanupResult() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
  }

  function buildFinalPrompt() {
    const p = prompt.trim();
    const presetAdd = PRESETS.find((x) => x.key === preset)?.add || "";
    if (!presetAdd) return p;
    return `${p}\n\nStyle: ${presetAdd}`;
  }

  async function handleGenerate() {
    const p = prompt.trim();
    if (!p) {
      setError("Please enter a prompt.");
      return;
    }

    setError(null);
    cleanupResult();
    setIsGenerating(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const body = {
        prompt: buildFinalPrompt(),
        size,
      };

      const res = await fetch(`${API_BASE}/genix/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
  let msg = `Request failed (${res.status})`;
  const ct = res.headers.get("content-type") || "";

  try {
    if (ct.includes("application/json")) {
      const j = await res.json();
      if (typeof j?.detail === "string") msg = j.detail;
      else if (Array.isArray(j?.detail)) msg = j.detail?.[0]?.msg || msg;
    } else {
      const t = await res.text().catch(() => "");
      if (t) msg = t;
      try {
        const parsed = JSON.parse(t);
        if (typeof parsed?.detail === "string") msg = parsed.detail;
      } catch {}
    }
  } catch {}

  setError(msg);
  return;
}

      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) {
        setError("Server returned a non-image response.");
        return;
      }

      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(url);
    } catch (e: any) {
      if (e?.name === "AbortError") setError("Canceled.");
      else setError(e?.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }

  function handleDownload() {
    if (!resultBlob) return;
    const a = document.createElement("a");
    const url = resultUrl || URL.createObjectURL(resultBlob);
    a.href = url;
    a.download = "genix.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Genix</h1>
            <p className="mt-2 text-sm text-white/60">Generate an image from a prompt.</p>
          </div>

          <a
            href="/tools"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
          >
            ← Back to Tools
          </a>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT: controls */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-semibold">Prompt</div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want…"
                className="mt-3 h-40 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none focus:border-white/20"
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-white/70">Style preset</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setPreset(p.key)}
                        className={[
                          "rounded-xl border px-3 py-2 text-xs transition",
                          preset === p.key
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                        ].join(" ")}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-white/70">Aspect</div>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as any)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none"
                  >
                    {SIZES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label} ({s.hint})
                      </option>
                    ))}
                  </select>

                  <div className="mt-2 text-xs text-white/40">
                    Tip: Keep prompts specific (subject + setting + lighting).
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    abortRef.current?.abort();
                    setIsGenerating(false);
                  }}
                  disabled={!isGenerating}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition"
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
				{isGenerating && (
                <div className="mt-3 text-xs text-white/50">
                 Generating… please keep this tab open.
                </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: result */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Result</div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      cleanupResult();
                      setError(null);
                    }}
                    disabled={!resultUrl || isGenerating}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!resultBlob}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-40 transition"
                  >
                    Download
                  </button>
				  <button
  onClick={() => {
    if (!resultBlob) return;

    const file = new File([resultBlob], "genix.png", { type: "image/png" });

    // store temporarily
    localStorage.setItem("morphai_source_image", URL.createObjectURL(file));

    window.location.href = "/tools/faceswap";
  }}
  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition"
>
Send to FaceSwap →
</button>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                {resultUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resultUrl} alt="Generated" className="h-[520px] w-full object-contain bg-black" />
                ) : (
                  <div className="flex h-[520px] items-center justify-center text-sm text-white/50">
                    Your generated image will appear here
                  </div>
                )}
              </div>

              {resultUrl && (
                <div className="mt-3 text-xs text-white/50">
                  Next step (optional): we can add “Send to FaceSwap as source” with one click.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}