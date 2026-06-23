"use client";

import Link from "next/link";
import { useBalances } from "@/hooks/use-expenses";
import { simplifyDebts } from "@/lib/simplify";
import { formatMoney } from "@/lib/money";
import type { MemberWithProfile } from "@/services/groups.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Minimal set of payments that would settle the group, each actionable. */
export function SettleSuggestions({
  groupId,
  currency,
  members,
}: {
  groupId: string;
  currency: string;
  members: MemberWithProfile[];
}) {
  const { data: balances } = useBalances(groupId);
  if (!balances) return null;

  const transfers = simplifyDebts(
    balances.map((b) => ({ userId: b.userId, net: b.net })),
  );
  if (transfers.length === 0) return null;

  const nameOf = (id: string) => {
    const m = members.find((x) => x.user_id === id);
    return m?.profile?.display_name ?? m?.profile?.email ?? "Member";
  };

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Suggested payments
      </h2>
      <Card className="p-0">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {transfers.map((t, i) => (
            <li
              key={`${t.from}-${t.to}-${i}`}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">{nameOf(t.from)}</span> →{" "}
                <span className="font-medium">{nameOf(t.to)}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatMoney(t.amount, currency)}
                </span>
                <Link
                  href={`/settle/new?group=${groupId}&from=${t.from}&to=${t.to}&amount=${t.amount}`}
                >
                  <Button size="sm" variant="secondary">
                    Settle
                  </Button>
                </Link>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
