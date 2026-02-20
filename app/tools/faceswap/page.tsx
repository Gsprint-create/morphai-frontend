"use client";

import { useEffect, useRef, useState } from "react";
import * as nsfwjs from "nsfwjs";
import * as tf from "@tensorflow/tfjs";

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

// --------------------
// Client-side NSFW (nsfwjs)
// --------------------
let NSFW_MODEL: nsfwjs.NSFWJS | null = null;

async function loadNsfwModel() {
  if (NSFW_MODEL) return NSFW_MODEL;
  await tf.ready();
  NSFW_MODEL = await nsfwjs.load();
  return NSFW_MODEL;
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

async function scanImageFile(file: File, threshold = 0.7) {
  const model = await loadNsfwModel();
  const img = await fileToImage(file);
  const preds = await model.classify(img);

  const lookup: Record<string, number> = {};
  for (const p of preds) lookup[p.className] = p.probability;

  // You chose Porn + Hentai only (good for fewer false positives)
  const porn = lookup["Porn"] ?? 0;
  const hentai = lookup["Hentai"] ?? 0;

  const isNsfw = Math.max(porn, hentai) >= threshold;
  return { isNsfw, preds };
}

export default function FaceSwapPage() {
  const [source, setSource] = useState<PickedFile | null>(null);
  const [target, setTarget] = useState<PickedFile | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const [consentChecked, setConsentChecked] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const canSwap = !!source && !!target && consentChecked && !isProcessing && !isScanning;

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
    loadNsfwModel().catch(() => {});
    return () => {
      abortRef.current?.abort();
      cleanupPicked(source);
      cleanupPicked(target);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onPick(file: File | null, which: "source" | "target") {
    setError(null);
    cleanupResult();

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG/JPG/WebP).");
      return;
    }

    setIsScanning(true);
    try {
      const { isNsfw } = await scanImageFile(file, 0.7);
      if (isNsfw) {
        setError("Blocked: explicit/adult images are not allowed.");
        return;
      }
    } catch {
      // If client scan fails, server-side NudeNet will still enforce.
    } finally {
      setIsScanning(false);
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

    if (!consentChecked) {
      setError("Please confirm you have permission to use these images.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    cleanupResult();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Re-scan right before sending (optional but strong)
      setIsScanning(true);
      try {
        const [srcScan, tgtScan] = await Promise.all([
          scanImageFile(source.file, 0.7),
          scanImageFile(target.file, 0.7),
        ]);
        if (srcScan.isNsfw || tgtScan.isNsfw) {
          setError("Blocked: explicit/adult images are not allowed.");
          return;
        }
      } catch {
      } finally {
        setIsScanning(false);
      }

      const fd = new FormData();
      fd.append("source", source.file);
      fd.append("target", target.file);
      fd.append("consent", "true");

      const params = new URLSearchParams({
        // swap_all: "true",
        // harmonize_enable: "true",
      });

      const res = await fetch(`${API_BASE}/swap/single?${params.toString()}`, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        const ct = res.headers.get("content-type") || "";

        try {
          if (ct.includes("application/json")) {
            const j = await res.json();
            if (typeof j?.detail === "string") message = j.detail;
            else if (Array.isArray(j?.detail)) message = j.detail?.[0]?.msg || message;
          } else {
            const txt = await res.text().catch(() => "");
            if (txt) message = txt;
            try {
              const parsed = JSON.parse(txt);
              if (typeof parsed?.detail === "string") message = parsed.detail;
            } catch {}
          }
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
      setIsScanning(false);
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
          {/* LEFT */}
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
                      <div className="text-sm font-semibold text-white/80">
                        {isScanning ? "Scanning..." : "Click to upload"}
                      </div>
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
                      <img src={source.url} alt="Source preview" className="h-72 w-full object-contain bg-black" />
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
                      <div className="text-sm font-semibold text-white/80">
                        {isScanning ? "Scanning..." : "Click to upload"}
                      </div>
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
                      <img src={target.url} alt="Target preview" className="h-72 w-full object-contain bg-black" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                ⚠️ No explicit content, minors, or non-consensual images. We block NSFW images automatically.
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-blue-500"
                />
                <label htmlFor="consent" className="text-xs text-white/70 leading-relaxed">
                  I confirm I have permission to use these images and they do not contain explicit content, minors, or
                  violate anyone’s privacy.
                </label>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                💡 Tip: Use a clear, front-facing photo with good lighting for the best results.
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-white/60">
                  {!source && !target
                    ? "Upload source + target to start."
                    : !source
                    ? "Upload a source face."
                    : !target
                    ? "Upload a target image."
                    : !consentChecked
                    ? "Confirm consent to enable swapping."
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
                    {isProcessing ? "Processing..." : isScanning ? "Scanning..." : "Swap Face"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Result</div>
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
                  <img src={resultUrl} alt="Result" className="h-[520px] w-full object-contain bg-black" />
                ) : (
                  <div className="flex h-[520px] items-center justify-center text-sm text-white/50">
                    {isProcessing ? "Swapping faces…" : "Your swapped image will appear here"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}