"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  icon: ReactNode;
  /** Returns true when this tab should be highlighted for a path. */
  match: (path: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: "/friends",
    label: "Friends",
    match: (p) => p.startsWith("/friends"),
    icon: (
      <Icon>
        <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
        <path d="M3 21v-1a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v1" />
      </Icon>
    ),
  },
  {
    href: "/groups",
    label: "Groups",
    // Covers /groups, /groups/new and the /group detail page.
    match: (p) => p.startsWith("/group"),
    icon: (
      <Icon>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </Icon>
    ),
  },
  {
    href: "/history",
    label: "History",
    match: (p) => p.startsWith("/history"),
    icon: (
      <Icon>
        <path d="M12 7v5l3 2" />
        <circle cx="12" cy="12" r="9" />
      </Icon>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    match: (p) => p.startsWith("/settings"),
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 2.6V1a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 2.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </Icon>
    ),
  },
];

export function AppNav() {
  const pathname = usePathname();

  // Render the four tabs with a raised "Add expense" button in the middle.
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  return (
    <nav className="sticky bottom-0 z-10 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-3xl items-center">
        {left.map((tab) => (
          <TabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}

        <div className="flex flex-1 justify-center">
          <Link
            href="/expenses/new"
            title="Add expense"
            aria-label="Add expense"
            className="group/fab -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-700"
          >
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>

        {right.map((tab) => (
          <TabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({ tab, pathname }: { tab: Tab; pathname: string }) {
  const active = tab.match(pathname);
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
        active
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
      )}
    >
      {tab.icon}
      {tab.label}
    </Link>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </svg>
  );
}
