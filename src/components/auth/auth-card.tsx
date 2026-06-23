import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

/** Centered card layout shared by the login and signup screens. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4 py-16 dark:from-zinc-900 dark:to-black">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo className="h-12 w-12 rounded-2xl shadow-lg shadow-emerald-500/30" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {children}
        </div>
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {footer}
        </p>
      </div>
    </div>
  );
}
