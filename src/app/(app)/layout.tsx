"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";

/** Layout for all signed-in pages: guard + top bar + bottom tab nav. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <AppNav />
    </RequireAuth>
  );
}
