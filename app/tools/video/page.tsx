"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function VideoPage() {
  const API_BASE =
    process.env.NEXT_PUBLIC_VIDEO_API_URL || "http://127.0.0.1:5000";

  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  const [seconds, setSeconds] = useState(2);
  const [fps, setFps] = useState(8);

  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [outputKey, setOutputKey] = useState("");
  const [error, setError] = useState("");

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // FIXED URL
  const videoUrl = useMemo(() => {
    if (!outputKey) return "";

    return `https://pub-408d41ca33f74c4a8f766f6ac4062d9f.r2.dev/${outputKey}`;
  }, [outputKey]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function createJob() {
    setError("");
    setOutputKey("");
    setProgress(0);
    setStatus("submitting");

    try {
      const res = await fetch(`${API_BASE}/generate-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          image_url: imageUrl,
          prompt,
          negative_prompt: negativePrompt,
          seconds,
          fps,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed");
      }

      setJobId(data.job_id);
      setStatus(data.status);

      startPolling(data.job_id);
    } catch (err: any) {
      setStatus("failed");
      setError(err.message || "Something went wrong");
    }
  }

  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${id}`);
        const data = await res.json();

        setStatus(data.status || "unknown");
        setProgress(data.progress || 0);
        setOutputKey(data.output_key || "");

        if (["done", "failed"].includes(data.status)) {
          clearInterval(pollRef.current!);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2500);
  }

  return (
    <div className="min-h-screen bg-[#070B14] p-8 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-3xl font-semibold">
          Image → Video
        </h1>

        <div className="grid gap-4">
          <input
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/30 p-3 outline-none"
          />

          {imageUrl && (
            <img
              src={imageUrl}
              alt="preview"
              className="max-h-48 rounded-xl object-cover"
            />
          )}

          <textarea
            placeholder="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] rounded-xl border border-white/10 bg-black/30 p-3 outline-none"
          />

          <textarea
            placeholder="Negative Prompt (optional)"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="min-h-[80px] rounded-xl border border-white/10 bg-black/30 p-3 outline-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Seconds
              </label>

              <input
                type="number"
                value={seconds}
                onChange={(e) => setSeconds(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                FPS
              </label>

              <input
                type="number"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
              />
            </div>
          </div>

          <button
            onClick={createJob}
            disabled={status === "submitting" || status === "running"}
            className="rounded-xl bg-cyan-400 p-3 font-medium text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "submitting" || status === "running"
              ? "Generating..."
              : "Generate Video"}
          </button>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2">
              Status:{" "}
              <span className="text-cyan-300">
                {status}
              </span>
            </div>

            <div>
              Progress:{" "}
              <span className="text-cyan-300">
                {progress}%
              </span>
            </div>

            {jobId && (
              <div className="mt-2 text-xs text-white/50">
                Job ID: {jobId}
              </div>
            )}
          </div>

          {videoUrl && (
            <video
              src={videoUrl}
              controls
              className="mt-4 w-full rounded-xl border border-white/10"
            />
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}