"use client";

import { useEffect } from "react";
import {
  useNotifications,
  useMarkNotificationsRead,
} from "@/hooks/use-notifications";
import { notificationText } from "@/services/notifications.service";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function NotificationsPage() {
  const { data: notifications, isPending, error } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const mutate = markRead.mutate;

  // Opening the inbox marks everything read (clears the bell badge).
  useEffect(() => {
    mutate();
  }, [mutate]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Notifications
      </h1>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-emerald-600" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : "Failed to load"}
        </p>
      ) : !notifications || notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No notifications yet. You&apos;ll be notified when someone adds an
          expense or settles up with you.
        </div>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={
                  n.read
                    ? "flex items-start gap-3 px-5 py-3"
                    : "flex items-start gap-3 bg-emerald-50/60 px-5 py-3 dark:bg-emerald-900/10"
                }
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800"
                  aria-hidden="true"
                >
                  {n.kind === "settlement" ? "✓" : "🧾"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-800 dark:text-zinc-100">
                    {notificationText(n)}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {n.group_name ? `${n.group_name} · ` : ""}
                    {new Date(n.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
