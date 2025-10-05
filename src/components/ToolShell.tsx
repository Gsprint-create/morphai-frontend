"use client";

import { useEffect, useRef, useState } from "react";

export default function ToolShell() {
  const [status, setStatus] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Toggle UI state (read from localStorage AFTER mount)
  const [proMode, setProMode] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("morphai:proMode");
      if (saved != null) setProMode(saved === "1");
    } catch {}
  }, []);
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("morphai:proMode", proMode ? "1" : "0");
    } catch {}
  }, [mounted, proMode]);

  const srcRef = useRef<HTMLInputElement | null>(null);
  const tgtRef = useRef<HTMLInputElement | null>(null);

  const onSwap = async () => {
    const src = srcRef.current?.files?.[0];
    const tgt = tgtRef.current?.files?.[0];
    if (!src || !tgt) {
      setStatus("Select both images");
      return;
    }
    setStatus("Uploading…");
    setResultUrl(null);
    try {
      const fd = new FormData();
      fd.append("source", src);
      fd.append("target", tgt);
      // optionally include toggle choice if your backend uses it
      fd.append("proMode", String(proMode));

      const r = await fetch("/api/swap", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Swap failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus("Done");
    } catch (e) {
      console.error(e);
      setStatus("Failed");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card">
        <h1 className="text-xl font-semibold mb-4">Face Swap</h1>

        {/* Toggle (client-only, safe after mount) */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm">Pro mode</label>
          <button
            type="button"
            aria-pressed={proMode}
            onClick={() => setProMode((v) => !v)}
            className={`relative h-7 w-12 rounded-full border border-black/10 transition
              ${proMode ? "bg-emerald-500/80" : "bg-white/10"}`}
          >
            <span
              className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white shadow
                transition-transform ${proMode ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* Source image */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Source image</label>
          <input ref={srcRef} type="file" accept="image/*" className="input" />
        </div>

        {/* Target image */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Target image</label>
          <input ref={tgtRef} type="file" accept="image/*" className="input" />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onSwap} className="btn">Swap</button>
          <span className="text-sm opacity-80">{status}</span>
        </div>
      </div>

      {resultUrl && (
        <div className="card mt-6" id="resultCard">
          <h2 className="text-lg font-medium mb-3">Result</h2>
          <img src={resultUrl} alt="Result" className="rounded-xl w-full h-auto" />
          <a href={resultUrl} className="btn mt-4 inline-block" download="swap.png">Download</a>
        </div>
      )}
    </div>
  );
}
