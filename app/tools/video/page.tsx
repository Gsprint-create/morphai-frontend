"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function VideoPage() {
  const API_BASE =
    process.env.NEXT_PUBLIC_VIDEO_API_URL || "http://127.0.0.1:5000";

  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  const [seconds, setSeconds] = useState(5);
  const [fps, setFps] =