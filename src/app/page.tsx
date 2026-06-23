"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/groups");
  }, [loading, user, router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 text-center dark:from-zinc-900 dark:to-black">
      <div className="flex flex-col items-center gap-6 py-24">
        <Logo className="h-20 w-20 rounded-3xl shadow-lg shadow-emerald-500/30" />
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Splitr
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Split expenses with friends and family, see who owes whom, and settle
          up — free, and installable as an app.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/signup">
            <Button>Get started</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
