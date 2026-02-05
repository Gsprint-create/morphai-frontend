"use client";

import { useMemo, useRef, useState } from "react";

const API_BASE = "https://morphai-production-9b8f.up.railway.app";

type PickedFile = {
  file: File;
  url: string; // local preview URL
  name: string;
  size: number;
  type: string;
};

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

  function onPick(
    file: File | null,
    which: "source" | "target"
  ) {
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

    // cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fd = new FormData();
      // IMPORTANT: keys must match FastAPI params
      fd.append("source", source.file);
      fd.append("target", target.file);

      const res = await fetch(`${API_BASE}/swap/single`, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      if (!res.ok) {
        // FastAPI often returns JSON: {"detail":"..."}
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

      // Safety: ensure it is an image
      if (!blob.type.startsWith("image/")) {
        setError("Server returned a non-image response.");
        return;
      }

      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(url);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setError("Canceled.");
      } else {
        setError(e?.message || "Swap failed.");
      }
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

        {/* Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload panels */}
          <div className="space-y-6">
            {/* Source */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Source face</div>
                  <div className="mt-1 text-xs text-white/50">
                    The face to insert
                  </div>
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
                      <div className="text-sm font-semibold text-white/80">
                        Click to upload
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        PNG / JPG / WebP
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="grid gap-4 md:grid-cols-[220px,1fr] md:items-center">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={source.url}
                        alt="Source preview"
                        className="h-[220px] w-full object-cover"
                      />
                    </div>
                    <div className="text-sm text-white/70">
                      <div className="font-medium text-white/85">
                        {source.name}
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        {source.type} • {humanSize(source.size)}
                      </div>
                      <div className="mt-3 text-xs text-white/50">
                        Tip: Use a clear, front-facing face for best detection.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Target */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Target image</div>
                  <div className="mt-1 text-xs text-white/50">
                    The image that will receive the face
                  </div>
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
                      <div className="text-sm font-semibold text-white/80">
                        Click to upload
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        PNG / JPG / WebP
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="grid gap-4 md:grid-cols-[220px,1fr] md:items-center">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={target.url}
                        alt="Target preview"
                        className="h-[220px] w-full object-cover"
                      />
                    </div>
                    <div className="text-sm text-white/70">
                      <div className="font-medium text-white/85">
                        {target.name}
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        {target.type} • {humanSize(target.size)}
                      </div>
                      <div className="mt-3 text-xs text-white/50">
                        Note: This endpoint swaps onto <span className="text-white/70">all faces</span> in the target.
                      </div>
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
                    onClick={() => {
                      abortRef.current?.abort();
                    }}
                    disabled={!isProcessing}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-40 transition"
                    title="Cancel in-progress request"
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
                If you see “No face found in source image”, try a clearer face crop or better lighting.
              </div>
            </div>
          </div>

          {/* Result panel */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Result</div>
                <div className="mt-1 text-xs text-white/50">
                  Output PNG returned by your Railway backend
                </div>
              </div>

              <div className="flex gap-3">
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
              {!resultUrl ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
                  <div>
                    <div className="text-sm font-semibold text-white/70">
                      No result yet
                    </div>
                    <div className="mt-2 text-xs text-white/50">
                      Your swapped image will appear here.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultUrl}
                    alt="FaceSwap result"
                    className="w-full object-contain"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-white/40">
              If the browser shows a blank image, it’s usually because the backend returned an error JSON.
              This page detects that and shows the error above.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
