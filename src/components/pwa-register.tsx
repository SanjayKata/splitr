"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (production only) so Splitr is installable and
 * has a basic offline shell. Skipped in dev to avoid caching stale chunks.
 */
export function PwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker
      .register(`${base}/sw.js`, { scope: `${base}/` })
      .catch(() => {
        /* registration is best-effort */
      });
  }, []);

  return null;
}
