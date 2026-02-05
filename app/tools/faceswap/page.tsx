"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Picked = { id: string; file: File; url: string; name: string };
type Focus = { x: number; y: number; ok: boolean; reason?: string };

const API = process.env.NEXT_PUBLIC_FACESWAP_API || "https://morphai-production-9b8f.up.railway.app";

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function makePicked(file: File, prefix: string): Picked {
  return { id: uid(prefix), file, url: URL.createObjectURL(file), name: file.name };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Chrome Shape Detection API (FaceDetector). If unavailable, returns ok:false.
async function detectFaceFocusFromUrl(url: string): Promise<Focus> {
  try {
    const FaceDetectorCtor = (globalThis as any).FaceDetector;
    if (!FaceDetectorCtor) return { x: 50, y: 30, ok: false, reason: "FaceDetector not supported" };

    const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
    const img = new Image();
    img.src = url;
    await img.decode();

    const faces = await detector.detect(img);
    if (!faces || faces.length === 0) return { x: 50, y: 30, ok: false, reason: "No face detected" };

    const box = faces[0].boundingBox as DOMRectReadOnly;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    const xPct = clamp((cx / img.naturalWidth) * 100, 0, 100);
    const yPct = clamp((cy / img.naturalHeight) * 100, 0, 100);

    return { x: xPct, y: yPct, ok: true };
  } catch (e: any) {
    return { x: 50, y: 30, ok: false, reason: String(e?.message || e) };
  }
}

function focusPosition(focus: Focus, manual: { x: number; y: number }) {
  const x = focus.ok ? focus.x : manual.x;
  const y = focus.ok ? focus.y : manual.y;
  return `${x}% ${y}%`;
}

export default function FaceSwapPage() {
  // Files
  const [singleSource, setSingleSource] = useState<Picked | null>(null);
  const [target, setTarget] = useState<Picked | null>(null);

  // UI
  const [autoFaceFocus, setAutoFaceFocus] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Focus
  const [targetFocus, setTargetFocus] = useState<Focus>({ x: 50, y: 30, ok: false });
  const [sourceFocus, setSourceFocus] = useState<Focus>({ x: 50, y: 30, ok: false });
  const [manualTargetFocus, setManualTargetFocus] = useState({ x: 50, y: 30 });
  const [manualSourceFocus, setManualSourceFocus] = useState({ x: 50, y: 30 });

  // Progress + cancel
  const abortRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "upload" | "swap" | "finalize" | "done" | "error" | "canceled">(
    "idle"
  );

  // ---------- cleanup ----------
  function revoke(p: Picked | null) {
    if (p?.url) URL.revokeObjectURL(p.url);
  }
  function clearResult() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }
  function cancelInFlight() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  useEffect(() => {
    return () => {
      cancelInFlight();
      revoke(singleSource);
      revoke(target);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- auto face focus ----------
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!autoFaceFocus || !target?.url) return;
      const f = await detectFaceFocusFromUrl(target.url);
      if (!cancelled) {
        setTargetFocus(f);
        if (!f.ok) setManualTargetFocus({ x: 50, y: 30 });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [autoFaceFocus, target?.url]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!autoFaceFocus || !singleSource?.url) return;
      const f = await detectFaceFocusFromUrl(singleSource.url);
      if (!cancelled) {
        setSourceFocus(f);
        if (!f.ok) setManualSourceFocus({ x: 50, y: 30 });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [autoFaceFocus, singleSource?.url]);

  // ---------- pickers ----------
  function pickSingle(setter: (p: Picked | null) => void, prefix: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setter(makePicked(file, prefix));
    };
    input.click();
  }

  // ---------- progress helpers ----------
  function stageLabel(s: typeof stage) {
    switch (s) {
      case "upload":
        return "Uploading images…";
      case "swap":
        return "Swapping face…";
      case "finalize":
        return "Finalizing result…";
      case "done":
        return "Done!";
      case "canceled":
        return "Canceled.";
      case "error":
        return "Something went wrong.";
      default:
        return "";
    }
  }

  function startProgressPump() {
    setProgress(5);
    setStage("upload");

    const started = Date.now();
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (Date.now() - started > 1200) setStage("swap");
        const next = p + Math.max(0.2, (90 - p) * 0.06);
        return Math.min(90, Number(next.toFixed(1)));
      });
    }, 120);

    return () => window.clearInterval(id);
  }

  function stopProgressDone() {
    setStage("finalize");
    setProgress(95);
    window.setTimeout(() => {
      setProgress(100);
      setStage("done");
      window.setTimeout(() => {
        setStage("idle");
        setProgress(0);
      }, 900);
    }, 250);
  }

  function stopProgressError(kind: "error" | "canceled") {
    setStage(kind);
    window.setTimeout(() => {
      setStage("idle");
      setProgress(0);
    }, 1200);
  }

  // ---------- action ----------
  const canSwap = useMemo(() => !!singleSource && !!target && !isProcessing, [singleSource, target, isProcessing]);

  async function handleSingleSwap() {
    if (!singleSource || !target || isProcessing) return;

    setIsProcessing(true);
    clearResult();
    cancelInFlight();

    const controller = new AbortController();
    abortRef.current = controller;

    const stopPump = startProgressPump();

    try {
      const fd = new FormData();
      // IMPORTANT: source first, target second (keys matter)
      fd.append("source", singleSource.file);
      fd.append("target", target.file);

      const res = await fetch(`${API}/swap/single`, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        stopPump();
        alert(txt || "Swap failed");
        stopProgressError("error");
        return;
      }

      stopPump();
      setStage("finalize");
      setProgress(95);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

      stopProgressDone();
    } catch (err: any) {
      stopPump();
      if (err?.name === "AbortError") stopProgressError("canceled");
      else {
        alert(err?.message || "Swap failed");
        stopProgressError("error");
      }
    } finally {
      setIsProcessing(false);
      abortRef.current = null;
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h1 className="text-3xl font-semibold">MorphAI FaceSwap</h1>
          <p className="mt-2 text-white/70">Upload a Source face and a Target image. We swap the face into the target.</p>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-xs text-white/60">Auto zoom to face</span>
            <button
              onClick={() => setAutoFaceFocus((v) => !v)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                autoFaceFocus ? "bg-emerald-500" : "bg-white/20"
              }`}
              aria-label="Toggle auto face focus"
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                  autoFaceFocus ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-2 text-xs text-white/40">
            Backend: <span className="text-white/60">{API}</span>
          </div>
        </header>

        {/* Source first, Target second */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Source */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Source Face</h2>
              {singleSource ? <span className="text-xs text-emerald-300">Selected</span> : <span className="text-xs text-white/50">Required</span>}
            </div>

            <button
              onClick={() =>
                pickSingle((p) => {
                  revoke(singleSource);
                  setSingleSource(p);
                  clearResult();
                  setSourceFocus({ x: 50, y: 30, ok: false });
                  setManualSourceFocus({ x: 50, y: 30 });
                }, "src")
              }
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm hover:bg-white/10"
            >
              {singleSource ? "Change source face" : "Choose source face"}
              {singleSource && <div className="mt-1 text-xs text-emerald-300">Selected: {singleSource.name}</div>}
            </button>

            {singleSource && (
              <div className="mt-3 text-xs text-white/50">
                {singleSource.file.type || "image"} • {formatBytes(singleSource.file.size)}
              </div>
            )}

            {singleSource?.url ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <img
                  src={singleSource.url}
                  alt="Source preview"
                  className="h-56 w-full bg-black"
                  style={{
                    objectFit: autoFaceFocus ? "cover" : "contain",
                    objectPosition: autoFaceFocus ? focusPosition(sourceFocus, manualSourceFocus) : "50% 50%",
                  }}
                />
              </div>
            ) : (
              <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-sm text-white/40">
                No source yet
              </div>
            )}

            {autoFaceFocus && singleSource?.url && !sourceFocus.ok && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-white/50">
                  Auto focus fallback ({sourceFocus.reason || "unknown"}) — adjust:
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-10">X</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={manualSourceFocus.x}
                    onChange={(e) => setManualSourceFocus((p) => ({ ...p, x: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-white/50 w-10 text-right">{manualSourceFocus.x}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-10">Y</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={manualSourceFocus.y}
                    onChange={(e) => setManualSourceFocus((p) => ({ ...p, y: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-white/50 w-10 text-right">{manualSourceFocus.y}</span>
                </div>
              </div>
            )}

            {singleSource && (
              <button
                onClick={() => {
                  revoke(singleSource);
                  setSingleSource(null);
                  clearResult();
                  setSourceFocus({ x: 50, y: 30, ok: false });
                }}
                className="mt-3 text-xs text-white/60 hover:text-white"
              >
                Remove source
              </button>
            )}
          </section>

          {/* Target */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Target Image</h2>
              {target ? <span className="text-xs text-emerald-300">Selected</span> : <span className="text-xs text-white/50">Required</span>}
            </div>

            <button
              onClick={() =>
                pickSingle((p) => {
                  revoke(target);
                  setTarget(p);
                  clearResult();
                  setTargetFocus({ x: 50, y: 30, ok: false });
                  setManualTargetFocus({ x: 50, y: 30 });
                }, "tgt")
              }
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm hover:bg-white/10"
            >
              {target ? "Change target image" : "Choose target image"}
              {target && <div className="mt-1 text-xs text-emerald-300">Selected: {target.name}</div>}
            </button>

            {target && (
              <div className="mt-3 text-xs text-white/50">
                {target.file.type || "image"} • {formatBytes(target.file.size)}
              </div>
            )}

            {target?.url ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <img
                  src={target.url}
                  alt="Target preview"
                  className="h-56 w-full bg-black"
                  style={{
                    objectFit: autoFaceFocus ? "cover" : "contain",
                    objectPosition: autoFaceFocus ? focusPosition(targetFocus, manualTargetFocus) : "50% 50%",
                  }}
                />
              </div>
            ) : (
              <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-sm text-white/40">
                No target yet
              </div>
            )}

            {autoFaceFocus && target?.url && !targetFocus.ok && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-white/50">
                  Auto focus fallback ({targetFocus.reason || "unknown"}) — adjust:
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-10">X</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={manualTargetFocus.x}
                    onChange={(e) => setManualTargetFocus((p) => ({ ...p, x: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-white/50 w-10 text-right">{manualTargetFocus.x}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-10">Y</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={manualTargetFocus.y}
                    onChange={(e) => setManualTargetFocus((p) => ({ ...p, y: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-white/50 w-10 text-right">{manualTargetFocus.y}</span>
                </div>
              </div>
            )}

            {target && (
              <button
                onClick={() => {
                  revoke(target);
                  setTarget(null);
                  clearResult();
                  setTargetFocus({ x: 50, y: 30, ok: false });
                }}
                className="mt-3 text-xs text-white/60 hover:text-white"
              >
                Remove target
              </button>
            )}
          </section>
        </div>

        {/* Run + Result */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-sm font-semibold">Run Swap</h3>
            <p className="mt-2 text-sm text-white/70">Source → Target (direct call to Railway backend)</p>

            <div className="mt-4 space-y-3">
              <button
                onClick={handleSingleSwap}
                disabled={!canSwap}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${
                  canSwap ? "bg-blue-500/90 hover:bg-blue-500" : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                {isProcessing ? "Processing…" : "Swap Face"}
              </button>

              {isProcessing && (
                <button
                  onClick={() => {
                    cancelInFlight();
                    setIsProcessing(false);
                    stopProgressError("canceled");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  Cancel
                </button>
              )}

              {(isProcessing || stage !== "idle") && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{stageLabel(stage)}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-blue-500/90 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-white/50">
              Tip: If you get a CORS error, fix it in the FastAPI CORSMiddleware allowed origins.
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Result</h3>
              {isProcessing ? (
                <span className="text-xs text-blue-300">Working…</span>
              ) : resultUrl ? (
                <span className="text-xs text-emerald-300">Ready</span>
              ) : (
                <span className="text-xs text-white/50">No result</span>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
              {resultUrl ? (
                <img src={resultUrl} alt="Result" className="h-64 w-full bg-black object-contain" />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-white/50">
                  {isProcessing ? "Swapping faces…" : "Your swapped image will appear here"}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={resultUrl || "#"}
                download="morphai-result.png"
                className={`rounded-xl border border-white/10 px-4 py-2 text-sm ${
                  resultUrl ? "bg-white/5 hover:bg-white/10" : "bg-white/5 text-white/30 pointer-events-none"
                }`}
              >
                Download
              </a>

              <button
                onClick={clearResult}
                disabled={!resultUrl || isProcessing}
                className={`rounded-xl border border-white/10 px-4 py-2 text-sm ${
                  resultUrl && !isProcessing ? "bg-white/5 hover:bg-white/10" : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <div className="mt-10 text-center text-xs text-white/40">
          Auto zoom uses browser FaceDetector. If unsupported, manual sliders appear.
        </div>
      </div>
    </main>
  );
}
