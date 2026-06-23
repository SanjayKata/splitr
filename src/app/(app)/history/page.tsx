"use client";

import { useHistory } from "@/hooks/use-history";
import { formatMoney } from "@/lib/money";
import { toCsv, downloadCsv } from "@/lib/csv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function HistoryPage() {
  const { data: items, isPending, error } = useHistory();

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["Date", "Type", "Title", "Detail", "Group", "Amount", "Currency"],
    ];
    for (const it of items ?? []) {
      rows.push([
        it.createdAt.slice(0, 10),
        it.kind,
        it.title,
        it.subtitle,
        it.groupName,
        it.amount,
        it.currency,
      ]);
    }
    downloadCsv("splitr-history.csv", toCsv(rows));
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          History
        </h1>
        <Button
          size="sm"
          variant="ghost"
          onClick={exportCsv}
          disabled={!items || items.length === 0}
        >
          Export
        </Button>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : "Failed to load history"}
        </p>
      )}

      {isPending ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-emerald-600" />
        </div>
      ) : !items || items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-700 dark:text-zinc-300">No activity yet</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Expenses you add will appear here, across all your groups.
          </p>
        </div>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={
                      item.kind === "settlement"
                        ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800"
                    }
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {item.groupName} · {item.subtitle} ·{" "}
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={
                    item.kind === "settlement"
                      ? "font-semibold text-emerald-600 dark:text-emerald-400"
                      : "font-semibold text-zinc-900 dark:text-zinc-100"
                  }
                >
                  {formatMoney(item.amount, item.currency)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
