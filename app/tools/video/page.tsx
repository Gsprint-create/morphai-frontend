"use client";

<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from "react";
=======
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type ApiErrorDetail = {
  loc?: Array<string | number>;
  msg?: string;
};

type ApiErrorResponse = {
  detail?: string | ApiErrorDetail[];
  error?: string;
  message?: string;
};

type UploadResponse = {
  url?: string;
};

type CreateJobResponse = {
  job_id?: string;
  status?: string;
  progress?: number;
};

type JobResponse = {
  job_id?: string;
  status?: string;
  progress?: number;
  output_url?: string;
  output_key?: string;
};

function getApiErrorMessage(data: ApiErrorResponse, fallback: string): string {
  if (typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        const field =
          Array.isArray(item.loc) && item.loc.length > 0
            ? String(item.loc[item.loc.length - 1])
            : "request";

        return `${field}: ${item.msg || "Invalid value"}`;
      })
      .join(" · ");
  }

  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;

  return fallback;
}

async function readJsonSafely<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
>>>>>>> 536deb9 (Fix VidX upload and generation flow)

export default function VideoPage() {
  const API_BASE =
    process.env.NEXT_PUBLIC_VIDEO_API_URL || "http://127.0.0.1:5000";

<<<<<<< HEAD
  const [imageUrl, setImageUrl] = useState("");
=======
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

>>>>>>> 536deb9 (Fix VidX upload and generation flow)
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  const [seconds, setSeconds] = useState(5);
<<<<<<< HEAD
  const [fps, setFps] =
=======
  const [fps, setFps] = useState(24);

  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState("");
  const [error, setError] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoUrl = useMemo(() => outputUrl, [outputUrl]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
    setError("");
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling(id: string) {
    stopPolling();

    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/jobs/${id}`, {
          cache: "no-store",
        });

        const data = await readJsonSafely<JobResponse & ApiErrorResponse>(
          response
        );

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data,
              "VidX could not check the video generation status."
            )
          );
        }

        const nextStatus = data.status || "unknown";
        setStatus(nextStatus);
        setProgress(Number(data.progress || 0));

        const returnedUrl = data.output_url || data.output_key || "";
        if (returnedUrl) setOutputUrl(returnedUrl);

        if (nextStatus === "done" || nextStatus === "failed") {
          stopPolling();

          if (nextStatus === "failed") {
            setError("VidX could not complete the video generation.");
          }
        }
      } catch (pollError: unknown) {
        stopPolling();
        setStatus("failed");
        setError(
          pollError instanceof Error
            ? pollError.message
            : "VidX could not check the generation status."
        );
      }
    }, 2500);
  }

  async function createJob() {
    setError("");
    setOutputUrl("");
    setJobId("");
    setProgress(0);
    setStatus("submitting");
    stopPolling();

    try {
      if (!imageFile) throw new Error("Please upload an image first.");
      if (!prompt.trim()) throw new Error("Please enter a motion prompt.");

      if (![5, 10].includes(Number(seconds))) {
        throw new Error("VidX currently supports 5 or 10 second videos.");
      }

      const formData = new FormData();
      formData.append("file", imageFile);

      const uploadResponse = await fetch(`${API_BASE}/upload-image`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await readJsonSafely<
        UploadResponse & ApiErrorResponse
      >(uploadResponse);

      if (!uploadResponse.ok) {
        throw new Error(
          getApiErrorMessage(uploadData, "VidX could not upload the image.")
        );
      }

      if (!uploadData.url) {
        throw new Error("VidX did not receive a valid image URL.");
      }

      const generationResponse = await fetch(`${API_BASE}/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: uploadData.url,
          prompt: prompt.trim(),
          negative_prompt: negativePrompt.trim(),
          seconds: Number(seconds),
          fps: Number(fps),
        }),
      });

      const generationData = await readJsonSafely<
        CreateJobResponse & ApiErrorResponse
      >(generationResponse);

      if (!generationResponse.ok) {
        throw new Error(
          getApiErrorMessage(
            generationData,
            "VidX could not start the video generation."
          )
        );
      }

      if (!generationData.job_id) {
        throw new Error("VidX did not return a valid generation job.");
      }

      setJobId(generationData.job_id);
      setStatus(generationData.status || "running");
      setProgress(Number(generationData.progress || 0));

      startPolling(generationData.job_id);
    } catch (createError: unknown) {
      setStatus("failed");
      setError(
        createError instanceof Error
          ? createError.message
          : "VidX encountered an unexpected error."
      );
    }
  }

  const isBusy = status === "submitting" || status === "running";

  return (
    <div className="min-h-screen bg-[#070B14] p-8 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-3xl font-semibold">VidX Image → Video</h1>

        <div className="grid gap-4">
          <label className="grid cursor-pointer gap-2 rounded-xl border border-dashed border-white/20 bg-black/30 p-4 transition hover:border-cyan-400/50">
            <span className="text-sm text-white/70">Upload image</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="block w-full text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-black"
            />
          </label>

          {imagePreview && (
            <img
              src={imagePreview}
              alt="Selected image preview"
              className="max-h-72 w-full rounded-xl border border-white/10 object-contain"
            />
          )}

          <textarea
            placeholder="Describe the movement or action"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-[120px] rounded-xl border border-white/10 bg-black/30 p-3 outline-none focus:border-cyan-400/50"
          />

          <textarea
            placeholder="Negative prompt (optional)"
            value={negativePrompt}
            onChange={(event) => setNegativePrompt(event.target.value)}
            className="min-h-[80px] rounded-xl border border-white/10 bg-black/30 p-3 outline-none focus:border-cyan-400/50"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Seconds
              </label>
              <select
                value={seconds}
                onChange={(event) => setSeconds(Number(event.target.value))}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">FPS</label>
              <input
                type="number"
                min={1}
                max={60}
                value={fps}
                onChange={(event) => setFps(Number(event.target.value))}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={createJob}
            disabled={isBusy}
            className="rounded-xl bg-cyan-400 p-3 font-medium text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Generating..." : "Generate Video"}
          </button>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2">
              Status: <span className="text-cyan-300">{status}</span>
            </div>
            <div>
              Progress: <span className="text-cyan-300">{progress}%</span>
            </div>
            {jobId && (
              <div className="mt-2 text-xs text-white/50">Job ID: {jobId}</div>
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
>>>>>>> 536deb9 (Fix VidX upload and generation flow)
