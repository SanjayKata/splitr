import { getCurrentUserId } from "@/repositories/auth.repository";
import * as groupsRepo from "@/repositories/groups.repository";
import * as expensesRepo from "@/repositories/expenses.repository";
import { selectSettlementsByGroups } from "@/repositories/settlements.repository";
import {
  selectProfilesByIds,
  type ProfileSummary,
} from "@/repositories/profiles.repository";
import {
  buildOverview,
  type CurrencyTotal,
  type FriendBalance,
} from "@/lib/overview";

export interface FriendBalanceView extends FriendBalance {
  profile: ProfileSummary | null;
}

export interface OverviewView {
  friends: FriendBalanceView[];
  totals: CurrencyTotal[];
}

/**
 * Cross-group rollup for the current user: per-friend balances (by currency,
 * with a per-group breakdown) and overall owe/owed totals per currency.
 */
export async function getOverview(): Promise<OverviewView> {
  const userId = await getCurrentUserId();
  const groups = await groupsRepo.selectMyGroups();
  if (groups.length === 0) return { friends: [], totals: [] };

  const groupIds = groups.map((g) => g.id);
  const [expenses, splits, settlements] = await Promise.all([
    expensesRepo.selectExpensesByGroups(groupIds),
    expensesRepo.selectSplitsByGroups(groupIds),
    selectSettlementsByGroups(groupIds),
  ]);

  const overview = buildOverview(
    userId,
    groups.map((g) => ({
      id: g.id,
      name: g.is_direct ? "Direct" : g.name,
      currency: g.currency,
    })),
    expenses.map((e) => ({ id: e.id, groupId: e.group_id, paidBy: e.paid_by })),
    splits.map((s) => ({
      expenseId: s.expense_id,
      groupId: s.group_id,
      userId: s.user_id,
      owedAmount: s.owed_amount,
    })),
    settlements.map((s) => ({
      groupId: s.group_id,
      fromUser: s.from_user,
      toUser: s.to_user,
      amount: s.amount,
    })),
  );

  // Attach friend profiles for display.
  const profiles = await selectProfilesByIds(
    overview.friends.map((f) => f.friendId),
  );
  const byId = new Map(profiles.map((p) => [p.id, p]));

  const friends: FriendBalanceView[] = overview.friends.map((f) => ({
    ...f,
    profile: byId.get(f.friendId) ?? null,
  }));

  return { friends, totals: overview.totals };
}
