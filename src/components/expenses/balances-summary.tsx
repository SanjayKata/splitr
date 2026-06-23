"use client";

import { useBalances } from "@/hooks/use-expenses";
import type { MemberWithProfile } from "@/services/groups.service";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function BalancesSummary({
  groupId,
  currency,
  members,
}: {
  groupId: string;
  currency: string;
  members: MemberWithProfile[];
}) {
  const { data: balances, isPending } = useBalances(groupId);

  const nameOf = (userId: string) => {
    const m = members.find((x) => x.user_id === userId);
    return m?.profile?.display_name ?? m?.profile?.email ?? "Member";
  };

  if (isPending) {
    return (
      <Card className="flex justify-center py-6">
        <Spinner className="h-5 w-5 text-emerald-600" />
      </Card>
    );
  }

  const nonZero = (balances ?? []).filter((b) => Math.abs(b.net) >= 0.01);

  if (nonZero.length === 0) {
    return (
      <Card>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Everyone is settled up 🎉
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {nonZero.map((b) => {
          const owed = b.net > 0;
          return (
            <li
              key={b.userId}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="text-zinc-700 dark:text-zinc-300">
                {nameOf(b.userId)}
              </span>
              <span
                className={
                  owed
                    ? "font-medium text-emerald-600 dark:text-emerald-400"
                    : "font-medium text-red-600 dark:text-red-400"
                }
              >
                {owed ? "gets back " : "owes "}
                {formatMoney(Math.abs(b.net), currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
