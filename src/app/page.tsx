"use client";

import { useState, useRef } from "react";

type SwapResponse =
  | { ok: true; image: string } // base64 PNG from /api/swap
  | { ok: false; error: string };

export default function Home() {
  const [srcFile, setSrcFile] = useState<File | null>(null);
  const [tgtFile, setTgtFile] = useState<File | null>(null);
  const [srcPreview, setSrcPreview] = useState<string | null>(null);
  const [tgtPreview, setTgtPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const resultLinkRef = useRef<HTMLAnchorElement>(null);

  function onPick(
    file: File | null,
    setterFile: (f: File | null) => void,
    setterPreview: (url: string | null) => void
  ) {
    setterFile(file);
    setResult(null);
    setMsg(null);
    if (file) {
      const url = URL.createObjectURL(file);
      setterPreview(url);
    } else {
      setterPreview(null);
    }
  }

  async function doSwap() {
    if (!srcFile || !tgtFile) {
      setMsg("Please select both images first.");
      return;
    }
    setLoading(true);
    setMsg(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append("source", srcFile);
      body.append("target", tgtFile);

      const res = await fetch("/api/swap", {
        method: "POST",
        body,
      });

      const data = (await res.json()) as SwapResponse;
      if (!res.ok || !data.ok) {
        setMsg((!data.ok && data.error) || "Swap failed.");
        return;
      }

      // data.image is base64 (no data URL prefix)
      const dataUrl = `data:image/png;base64,${data.image}`;
      setResult(dataUrl);
      setMsg("Done!");
    } catch (e) {
      setMsg("Network error while swapping.");
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setSrcFile(null);
    setTgtFile(null);
    setSrcPreview(null);
    setTgtPreview(null);
    setResult(null);
    setMsg(null);
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-3xl card">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">MorphAI — Face Swap</h1>
          <p className="text-sm opacity-75 mt-1">
            Upload a <b>source (face)</b> and a <b>target (photo)</b>, then hit Swap.
          </p>
        </div>

        {/* Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm">Source (face)</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => onPick(e.target.files?.[0] ?? null, setSrcFile, setSrcPreview)}
            />
            <div className="preview-box">
              {srcPreview ? (
                <img src={srcPreview} alt="Source preview" className="preview-img" />
              ) : (
                <span className="preview-empty">No image</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Target (photo)</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => onPick(e.target.files?.[0] ?? null, setTgtFile, setTgtPreview)}
            />
            <div className="preview-box">
              {tgtPreview ? (
                <img src={tgtPreview} alt="Target preview" className="preview-img" />
              ) : (
                <span className="preview-empty">No image</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            className="btn btn-primary flex-1"
            onClick={doSwap}
            disabled={loading}
          >
            {loading ? "Swapping…" : "Swap"}
          </button>
          <button className="btn flex-1" onClick={resetAll} disabled={loading}>
            Reset
          </button>
        </div>

        {/* Messages */}
        {msg && (
          <p className={`mt-4 text-sm ${msg === "Done!" ? "text-green-500" : "text-red-400"}`}>
            {msg}
          </p>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-3">
            <div className="preview-box">
              <img src={result} alt="Result" className="preview-img" />
            </div>
            <div className="flex gap-3">
              <a
                ref={resultLinkRef}
                download="morphai-result.png"
                href={result}
                className="btn btn-primary flex-1 text-center"
              >
                Download PNG
              </a>
              <button className="btn flex-1" onClick={() => setResult(null)}>
                Hide
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
