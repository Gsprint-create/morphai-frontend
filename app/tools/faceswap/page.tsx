"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = "https://morphai-production-9b8f.up.railway.app";

type PickedFile = {
  file: File;
  url: string;
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

  function cleanupPicked(p: PickedFile | null) {
    if (!p) return;
    try {
      URL.revokeObjectURL(p.url);
    } catch {}
  }

  function cleanupResult() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      cleanupPicked(source);
      cleanupPicked(target);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // IMPORTANT: backend expects these keys
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
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">FaceSwap</h1>
            <p className="mt-2 text-sm text-white/60">
              Upload a <span className="text-white/80 font-medium">source face</span> and a{" "}
              <span className="text-white/80 font-medium">target image</span>.
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

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT: inputs */}
          <div className="space-y-6">
            {/* Source */}
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

                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={source.url}
                        alt="Source preview"
                        className="h-72 w-full object-contain bg-black"
                      />
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

                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={target.url}
                        alt="Target preview"
                        className="h-72 w-full object-contain bg-black"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-white/60">
                  {!source && !target
                    ? "Upload source + target to start."
                    : !source
                    ? "Upload a source face."
                    : !target
                    ? "Upload a target image."
                    : "Ready. Click Swap Face."}
                </div>

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
                Note: current backend swaps onto all faces in the target.
              </div>
            </div>
          </div>

          {/* RIGHT: result */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Result</div>
                  <div className="mt-1 text-xs text-white/50">Output PNG from Railway</div>
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

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                {resultUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="h-[520px] w-full object-contain bg-black"
                  />
                ) : (
                  <div className="flex h-[520px] items-center justify-center text-sm text-white/50">
                    {isProcessing ? "Swapping faces…" : "Your swapped image will appear here"}
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-white/40">
                If result looks “off”, we can add alignment options on backend (face selection, swap first face only,
                etc.).
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
