import * as groupsRepo from "@/repositories/groups.repository";
import * as expensesRepo from "@/repositories/expenses.repository";
import { selectSettlementsByGroups } from "@/repositories/settlements.repository";
import { selectProfilesByIds } from "@/repositories/profiles.repository";
import { categoryEmoji } from "@/lib/categories";

export interface ActivityItem {
  id: string;
  kind: "expense" | "settlement";
  icon: string;
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  groupName: string;
  createdAt: string;
}

/**
 * Chronological activity across all the user's groups (newest first):
 * expenses added and payments recorded.
 */
export async function getActivity(): Promise<ActivityItem[]> {
  const groups = await groupsRepo.selectMyGroups();
  if (groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);
  const [expenses, settlements] = await Promise.all([
    expensesRepo.selectExpensesByGroups(groupIds),
    selectSettlementsByGroups(groupIds),
  ]);
  if (expenses.length === 0 && settlements.length === 0) return [];

  const groupName = new Map(
    groups.map((g) => [g.id, g.is_direct ? "Direct" : g.name]),
  );

  // Names for everyone referenced as payer / payment parties.
  const userIds = new Set<string>();
  for (const e of expenses) userIds.add(e.paid_by);
  for (const s of settlements) {
    userIds.add(s.from_user);
    userIds.add(s.to_user);
  }
  const profiles = await selectProfilesByIds([...userIds]);
  const nameOf = new Map(
    profiles.map((p) => [p.id, p.display_name ?? p.email ?? "Someone"]),
  );

  const expenseItems: ActivityItem[] = expenses.map((e) => ({
    id: `e-${e.id}`,
    kind: "expense",
    icon: categoryEmoji(e.category),
    title: e.description,
    subtitle: `${nameOf.get(e.paid_by) ?? "Someone"} paid`,
    amount: e.amount,
    currency: e.currency,
    groupName: groupName.get(e.group_id) ?? "Group",
    createdAt: e.created_at,
  }));

  const settlementItems: ActivityItem[] = settlements.map((s) => ({
    id: `s-${s.id}`,
    kind: "settlement",
    icon: "✓",
    title: `${nameOf.get(s.from_user) ?? "Someone"} paid ${
      nameOf.get(s.to_user) ?? "someone"
    }`,
    subtitle: s.note ?? "Settlement",
    amount: s.amount,
    currency: s.currency,
    groupName: groupName.get(s.group_id) ?? "Group",
    createdAt: s.created_at,
  }));

  return [...expenseItems, ...settlementItems].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}
