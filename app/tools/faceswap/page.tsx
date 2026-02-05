"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "https://morphai-production-9b8f.up.railway.app";

type PickedFile = {
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
};

type FaceBox = { x: number; y: number; w: number; h: number }; // normalized 0..1

function humanSize(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---- Face detector helper (browser native, if available) ----
async function detectFaceBox(img: HTMLImageElement): Promise<FaceBox | null> {
  // @ts-ignore
  const FaceDetectorCtor = (globalThis as any).FaceDetector;
  if (!FaceDetectorCtor) return null;

  try {
    // @ts-ignore
    const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(img);
    if (!faces || !faces.length) return null;

    const b = faces[0].boundingBox as DOMRectReadOnly;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return null;

    const x = Math.max(0, Math.min(1, b.x / iw));
    const y = Math.max(0, Math.min(1, b.y / ih));
    const w = Math.max(0, Math.min(1, b.width / iw));
    const h = Math.max(0, Math.min(1, b.height / ih));

    return { x, y, w, h };
  } catch {
    return null;
  }
}

// ---- Compute a "nice" zoom + pan so the face is centered ----
function faceBoxToView(box: FaceBox, strength = 1.35) {
  // Center of box
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;

  // Zoom so box roughly fills the viewport (heuristic)
  const boxSize = Math.max(box.w, box.h);
  const zoom = Math.min(4, Math.max(1, (1 / boxSize) / strength));

  // Pan offsets in normalized image coords
  // We store pan in [-0.5..0.5] range for ease: (0,0)=centered
  const panX = 0.5 - cx;
  const panY = 0.5 - cy;

  return { zoom, panX, panY };
}

// ---- Reusable viewer with auto face zoom + manual controls ----
function ZoomImageViewer(props: {
  title: string;
  src?: string | null;
  hint?: string;
  // allow detecting face from this image
  enableAutoFaceZoom?: boolean;
}) {
  const { title, src, hint, enableAutoFaceZoom = true } = props;

  const imgRef = useRef<HTMLImageElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const [autoStatus, setAutoStatus] = useState<"idle" | "detecting" | "applied" | "unavailable" | "none">("idle");

  // Reset when src changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAutoStatus("idle");
  }, [src]);

  // Try auto face zoom on load
  useEffect(() => {
    if (!src || !enableAutoFaceZoom) return;

    const img = imgRef.current;
    if (!img) return;

    let canceled = false;

    async function run() {
      // @ts-ignore
      const FaceDetectorCtor = (globalThis as any).FaceDetector;
      if (!FaceDetectorCtor) {
        setAutoStatus("unavailable");
        return;
      }

      setAutoStatus("detecting");

      // wait a tick to ensure natural sizes available
      await new Promise((r) => setTimeout(r, 50));
      if (canceled) return;

      const box = await detectFaceBox(img);
      if (canceled) return;

      if (!box) {
        setAutoStatus("none");
        return;
      }

      const v = faceBoxToView(box);
      setZoom(v.zoom);
      setPan({ x: v.panX, y: v.panY });
      setAutoStatus("applied");
    }

    // run once when image fully loaded
    if (img.complete) run();
    else img.onload = () => run();

    return () => {
      canceled = true;
      if (img) img.onload = null;
    };
  }, [src, enableAutoFaceZoom]);

  function onMouseDown(e: React.MouseEvent) {
    if (!src) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;

    const w = wrapRef.current?.clientWidth || 1;
    const h = wrapRef.current?.clientHeight || 1;

    const dx = (e.clientX - dragStart.current.mx) / w;
    const dy = (e.clientY - dragStart.current.my) / h;

    // Move pan in same direction (invert to feel natural)
    setPan({
      x: dragStart.current.px + dx * (1 / zoom),
      y: dragStart.current.py + dy * (1 / zoom),
    });
  }

  function onMouseUp() {
    setDragging(false);
    dragStart.current = null;
  }

  // Clamp pan a bit to avoid losing image completely
  useEffect(() => {
    setPan((p) => ({
      x: Math.max(-1, Math.min(1, p.x)),
      y: Math.max(-1, Math.min(1, p.y)),
    }));
  }, [zoom]);

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAutoStatus("idle");
  }

  // Translate: center + pan offsets
  const transform = `translate(calc(${pan.x} * 100%), calc(${pan.y} * 100%)) scale(${zoom})`;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {hint && <div className="mt-1 text-xs text-white/50">{hint}</div>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition"
            disabled={!src}
            title="Reset zoom/pan"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4">
        {!src ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
            <div className="text-xs text-white/50">No image</div>
          </div>
        ) : (
          <div
            ref={wrapRef}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-black"
            style={{ height: 360, cursor: dragging ? "grabbing" : "grab" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt={title}
              className="absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                transform: `translate(-50%, -50%) ${transform}`,
                transformOrigin: "center center",
                willChange: "transform",
              }}
              draggable={false}
            />

            <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] text-white/70">
              Drag to pan
            </div>

            {enableAutoFaceZoom && (
              <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] text-white/70">
                {autoStatus === "detecting" && "Auto-zoom: detecting…"}
                {autoStatus === "applied" && "Auto-zoom: face centered"}
                {autoStatus === "none" && "Auto-zoom: no face found"}
                {autoStatus === "unavailable" && "Auto-zoom: unsupported"}
                {autoStatus === "idle" && "Auto-zoom: ready"}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/70">Zoom</div>
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={!src}
              className="mt-2 w-full"
            />
            <div className="mt-1 text-[11px] text-white/50">{zoom.toFixed(2)}×</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/70">Pan X</div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={pan.x}
              onChange={(e) => setPan((p) => ({ ...p, x: Number(e.target.value) }))}
              disabled={!src}
              className="mt-2 w-full"
            />
            <div className="mt-1 text-[11px] text-white/50">{pan.x.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/70">Pan Y</div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={pan.y}
              onChange={(e) => setPan((p) => ({ ...p, y: Number(e.target.value) }))}
              disabled={!src}
              className="mt-2 w-full"
            />
            <div className="mt-1 text-[11px] text-white/50">{pan.y.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-white/40">
          Auto face zoom uses the browser’s <span className="text-white/60">FaceDetector</span> when available.
          If your browser doesn’t support it, use the sliders.
        </div>
      </div>
    </div>
  );
}

export default function FaceSwapPage() {
  const [source, setSource] = useState<PickedFile | null>(null);
  const [target, setTarget] = useState<PickedFile | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const canSwap = !!source && !!target && !isProcessing;

  const readyHint = useMemo(() => {
    if (!source && !target) return "Upload a source face and a target image.";
    if (!source) return "Upload a source face (the face you want to insert).";
    if (!target) return "Upload a target image (the image that will receive the face).";
    return "Ready. Click Swap Face.";
  }, [source, target]);

  function cleanupResult() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
  }

  function cleanupPicked(p: PickedFile | null) {
    if (!p) return;
    try {
      URL.revokeObjectURL(p.url);
    } catch {}
  }

  function onPick(file: File | null, which: "source" | "target") {
    setError(null);
    cleanupResult();

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG/JPG/WebP).");
      return;
    }

    const picked: PickedFile = {
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    };

    if (which === "source") {
      cleanupPicked(source);
      setSource(picked);
    } else {
      cleanupPicked(target);
      setTarget(picked);
    }
  }

  function remove(which: "source" | "target") {
    setError(null);
    cleanupResult();
    if (which === "source") {
      cleanupPicked(source);
      setSource(null);
    } else {
      cleanupPicked(target);
      setTarget(null);
    }
  }

  async function handleSwap() {
    if (!source || !target || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    cleanupResult();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fd = new FormData();
      fd.append("source", source.file);
      fd.append("target", target.file);

      const res = await fetch(`${API_BASE}/swap/single`, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let message = txt || `Request failed (${res.status})`;
        try {
          const parsed = JSON.parse(txt);
          if (parsed?.detail) message = parsed.detail;
        } catch {}
        setError(message);
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
      else setError(e?.message || "Swap failed.");
    } finally {
      setIsProcessing(false);
      abortRef.current = null;
    }
  }

  function handleDownload() {
    if (!resultBlob) return;
    const a = document.createElement("a");
    const url = resultUrl || URL.createObjectURL(resultBlob);
    a.href = url;
    a.download = "faceswap_result.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">FaceSwap</h1>
            <p className="mt-2 text-sm text-white/60">
              Upload a <span className="text-white/80 font-medium">source face</span> and a{" "}
              <span className="text-white/80 font-medium">target image</span>. We’ll swap the face on the server
              and return a PNG.
            </p>
            <p className="mt-2 text-xs text-white/40">
              Backend: <span className="text-white/60">{API_BASE}</span>
            </p>
          </div>

          <a
            href="/tools"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
          >
            ← Back to Tools
          </a>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Two-column */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: pickers + action */}
          <div className="space-y-6">
            {/* Source picker */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Source face</div>
                  <div className="mt-1 text-xs text-white/50">The face to insert</div>
                </div>

                {source && (
                  <button
                    onClick={() => remove("source")}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="mt-4">
                {!source ? (
                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center hover:bg-white/10 transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPick(e.target.files?.[0] || null, "source")}
                    />
                    <div>
                      <div className="text-sm font-semibold text-white/80">Click to upload</div>
                      <div className="mt-1 text-xs text-white/50">PNG / JPG / WebP</div>
                    </div>
                  </label>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium text-white/85">{source.name}</div>
                    <div className="mt-1 text-xs text-white/50">
                      {source.type} • {humanSize(source.size)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Target picker */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Target image</div>
                  <div className="mt-1 text-xs text-white/50">The image that will receive the face</div>
                </div>

                {target && (
                  <button
                    onClick={() => remove("target")}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="mt-4">
                {!target ? (
                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center hover:bg-white/10 transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPick(e.target.files?.[0] || null, "target")}
                    />
                    <div>
                      <div className="text-sm font-semibold text-white/80">Click to upload</div>
                      <div className="mt-1 text-xs text-white/50">PNG / JPG / WebP</div>
                    </div>
                  </label>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium text-white/85">{target.name}</div>
                    <div className="mt-1 text-xs text-white/50">
                      {target.type} • {humanSize(target.size)}
                    </div>
                    <div className="mt-2 text-[11px] text-white/50">
                      Note: this swaps onto <span className="text-white/70">all faces</span> in target.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-white/60">{readyHint}</div>

                <div className="flex gap-3">
                  <button
                    onClick={() => abortRef.current?.abort()}
                    disabled={!isProcessing}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40 transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSwap}
                    disabled={!canSwap}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition"
                  >
                    {isProcessing ? "Processing..." : "Swap Face"}
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-white/40">
                If you see “No face found”, use a clearer face crop or better lighting.
              </div>
            </div>
          </div>

          {/* Right: viewers */}
          <div className="space-y-6">
            <ZoomImageViewer
              title="Source preview (zoom-to-face)"
              src={source?.url}
              hint="Auto-zooms to face if supported. Drag to pan, use sliders to adjust."
              enableAutoFaceZoom={true}
            />

            <ZoomImageViewer
              title="Target preview (zoom-to-face)"
              src={target?.url}
              hint="Auto-zooms to face if supported. Drag to pan, use sliders to adjust."
              enableAutoFaceZoom={true}
            />

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Result (zoom-to-face)</div>
                  <div className="mt-1 text-xs text-white/50">Output PNG returned by Railway</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      cleanupResult();
                      setError(null);
                    }}
                    disabled={!resultUrl || isProcessing}
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
                </div>
              </div>

              <div className="mt-4">
                <ZoomImageViewer
                  title="Result view"
                  src={resultUrl}
                  hint={!resultUrl ? "No result yet." : "Drag to pan, use sliders to adjust."}
                  enableAutoFaceZoom={true}
                />
              </div>

              <div className="mt-3 text-[11px] text-white/40">
                If the backend returns JSON errors, you’ll see it in the red box above.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
