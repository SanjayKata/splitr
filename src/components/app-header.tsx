"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

/** Top bar for signed-in pages: brand + current user. */
export function AppHeader() {
  const { user } = useAuth();

  const name =
    (user?.user_metadata?.display_name as string | undefined) ?? user?.email;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link
          href="/groups"
          className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-black text-white">
            ₹
          </span>
          Splitr
        </Link>
        {name && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {name}
          </span>
        )}
      </div>
    </header>
  );
}
