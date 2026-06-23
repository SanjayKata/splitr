"use client";

import { useExpenses } from "@/hooks/use-expenses";
import { toCsv, downloadCsv } from "@/lib/csv";
import { categoryLabel } from "@/lib/categories";
import type { MemberWithProfile } from "@/services/groups.service";
import { Button } from "@/components/ui/button";

export function ExportExpensesButton({
  groupId,
  groupName,
  members,
}: {
  groupId: string;
  groupName: string;
  members: MemberWithProfile[];
}) {
  const { data: expenses } = useExpenses(groupId);

  const nameOf = (id: string) => {
    const m = members.find((x) => x.user_id === id);
    return m?.profile?.display_name ?? m?.profile?.email ?? "Member";
  };

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["Date", "Description", "Category", "Paid by", "Amount", "Currency"],
    ];
    for (const e of expenses ?? []) {
      rows.push([
        e.created_at.slice(0, 10),
        e.description,
        categoryLabel(e.category),
        nameOf(e.paid_by),
        e.amount,
        e.currency,
      ]);
    }
    const safeName = groupName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadCsv(`${safeName}-expenses.csv`, toCsv(rows));
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={exportCsv}
      disabled={!expenses || expenses.length === 0}
    >
      Export
    </Button>
  );
}
