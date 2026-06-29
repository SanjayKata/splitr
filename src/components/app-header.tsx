"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { Logo } from "@/components/logo";

/** Top bar for signed-in pages: brand + notifications bell + current user. */
export function AppHeader() {
  const { user } = useAuth();
  const { data: notifications } = useNotifications();

  const unread = (notifications ?? []).filter((n) => !n.read).length;
  const name =
    (user?.user_metadata?.display_name as string | undefined) ?? user?.email;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link
          href="/groups"
          className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50"
        >
          <Logo className="h-7 w-7" />
          Splitr
        </Link>
        <div className="flex items-center gap-3">
          {name && (
            <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">
              {name}
            </span>
          )}
          <Link
            href="/notifications"
            aria-label={
              unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
            }
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
