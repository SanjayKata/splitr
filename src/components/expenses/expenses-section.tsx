"use client";

import Link from "next/link";
import type { Group } from "@/types/database";
import type { MemberWithProfile } from "@/services/groups.service";
import { Button } from "@/components/ui/button";
import { BalancesSummary } from "./balances-summary";
import { SettleSuggestions } from "./settle-suggestions";
import { ExpenseList } from "./expense-list";
import { ExportExpensesButton } from "./export-expenses-button";

export function ExpensesSection({
  group,
  members,
}: {
  group: Group;
  members: MemberWithProfile[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle className="mb-0">Balances</SectionTitle>
          <Link href={`/settle/new?group=${group.id}`}>
            <Button size="sm" variant="secondary">
              Settle up
            </Button>
          </Link>
        </div>
        <BalancesSummary
          groupId={group.id}
          currency={group.currency}
          members={members}
        />
      </section>

      <SettleSuggestions
        groupId={group.id}
        currency={group.currency}
        members={members}
      />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle className="mb-0">Expenses</SectionTitle>
          <div className="flex items-center gap-2">
            <ExportExpensesButton
              groupId={group.id}
              groupName={group.name}
              members={members}
            />
            <Link href={`/expenses/new?group=${group.id}`}>
              <Button size="sm">Add expense</Button>
            </Link>
          </div>
        </div>
        <ExpenseList groupId={group.id} members={members} />
      </section>
    </div>
  );
}

function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mb-2 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400 ${className}`}
    >
      {children}
    </h2>
  );
}
