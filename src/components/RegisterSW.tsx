// src/components/RegisterSW.tsx
"use client";

import { useEffect, useState } from "react";

export default function RegisterSW() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let regRef: ServiceWorkerRegistration | null = null;

    const handleUpdateFound = () => {
      const sw = regRef?.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          setUpdateReady(true);
        }
      });
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      regRef = reg ?? null;
      if (!reg) return;
      reg.addEventListener("updatefound", handleUpdateFound);
    });

    return () => {
      // Clean up if registration supports removeEventListener
      regRef?.removeEventListener?.("updatefound", handleUpdateFound as EventListener);
    };
  }, []);

  const applyUpdate = () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.waiting?.postMessage?.({ type: "SKIP_WAITING" });
      setTimeout(() => window.location.reload(), 150);
    });
  };

  if (!updateReady) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 card flex items-center gap-3">
      <span>New version available</span>
      <button className="btn" onClick={applyUpdate}>
        Update
      </button>
    </div>
  );
}
