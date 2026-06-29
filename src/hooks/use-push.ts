"use client";

import { useCallback, useEffect, useState } from "react";
import {
  disablePush,
  enablePush,
  getExistingSubscription,
  isPushSupported,
} from "@/lib/push";

export function usePush() {
  const [supported] = useState(isPushSupported);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    getExistingSubscription().then((sub) => setEnabled(!!sub));
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await enablePush();
      setEnabled(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't enable notifications",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await disablePush();
      setEnabled(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't disable notifications",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  return { supported, enabled, busy, error, enable, disable };
}
