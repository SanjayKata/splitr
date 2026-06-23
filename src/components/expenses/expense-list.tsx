"use client";

import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import type { MemberWithProfile } from "@/services/groups.service";
import type { ExpenseWithSplits } from "@/services/expenses.service";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { categoryEmoji, categoryLabel } from "@/lib/categories";
import { getReceiptUrl } from "@/repositories/receipts.repository";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ExpenseList({
  groupId,
  members,
}: {
  groupId: string;
  members: MemberWithProfile[];
}) {
  const { data: expenses, isPending, error } = useExpenses(groupId);
  const deleteExpense = useDeleteExpense(groupId);

  const nameOf = (userId: string) => {
    const m = members.find((x) => x.user_id === userId);
    return m?.profile?.display_name ?? m?.profile?.email ?? "Member";
  };

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-5 w-5 text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        {error instanceof Error ? error.message : "Failed to load expenses"}
      </p>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No expenses yet. Add the first one above.
      </div>
    );
  }

  return (
    <Card className="p-0">
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {expenses.map((e) => (
          <ExpenseRow
            key={e.id}
            expense={e}
            payerName={nameOf(e.paid_by)}
            onDelete={() => deleteExpense.mutate(e.id)}
            deleting={
              deleteExpense.isPending && deleteExpense.variables === e.id
            }
          />
        ))}
      </ul>
    </Card>
  );
}

function ReceiptButton({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);

  async function view() {
    setLoading(true);
    try {
      const url = await getReceiptUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={loading}
      onClick={view}
      aria-label="View receipt"
      title="View receipt"
    >
      📎
    </Button>
  );
}

function ExpenseRow({
  expense,
  payerName,
  onDelete,
  deleting,
}: {
  expense: ExpenseWithSplits;
  payerName: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  const date = new Date(expense.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800"
          title={categoryLabel(expense.category)}
          aria-hidden="true"
        >
          {categoryEmoji(expense.category)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
            {expense.description}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {payerName} paid · {date}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {expense.receipt_url && <ReceiptButton path={expense.receipt_url} />}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {formatMoney(expense.amount, expense.currency)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          loading={deleting}
          onClick={onDelete}
          aria-label={`Delete ${expense.description}`}
        >
          ✕
        </Button>
      </div>
    </li>
  );
}
