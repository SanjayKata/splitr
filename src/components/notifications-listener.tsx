"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useNotificationsRealtime } from "@/hooks/use-notifications";
import { notificationText } from "@/services/notifications.service";
import type { Notification } from "@/types/database";

interface Toast {
  id: string;
  text: string;
}

/**
 * Listens for realtime notifications (anywhere in the signed-in app) and shows
 * a transient toast for each. Mounted once in the app layout.
 */
export function NotificationsListener() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const onInsert = useCallback((n: Notification) => {
    const toast = { id: n.id, text: notificationText(n) };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== toast.id)),
      5000,
    );
  }, []);

  useNotificationsRealtime(user?.id, onInsert);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <span aria-hidden="true">🔔</span>
          {t.text}
        </div>
      ))}
    </div>
  );
}
