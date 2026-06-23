import * as expensesRepo from "@/repositories/expenses.repository";
import * as groupsRepo from "@/repositories/groups.repository";
import { selectSettlementsByGroup } from "@/repositories/settlements.repository";
import { callEnsureDirectGroup } from "@/repositories/friends.repository";
import { uploadReceipt } from "@/repositories/receipts.repository";
import { computeShares, type SplitEntry } from "@/lib/split";
import { computeNetBalances, type Balance } from "@/lib/balances";
import type { Expense, ExpenseSplit, SplitType } from "@/types/database";

/** Target of a flexibly-added expense: an existing group, or a friend. */
export type ExpenseTarget =
  | { type: "group"; groupId: string }
  | { type: "friend"; friendId: string };

/** An expense together with its per-member splits. */
export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[];
}

export interface AddExpenseInput {
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  category?: string | null;
  splitType: SplitType;
  /** Participants and their per-type input (exact amount / percent / share). */
  entries: SplitEntry[];
  receiptUrl?: string | null;
}

/** Add an expense with a given split type; amounts are resolved + validated. */
export async function addExpense(input: AddExpenseInput): Promise<Expense> {
  const shares = computeShares(input.amount, input.splitType, input.entries);
  return expensesRepo.callCreateExpense({
    groupId: input.groupId,
    description: input.description.trim(),
    amount: input.amount,
    currency: input.currency,
    paidBy: input.paidBy,
    category: input.category?.trim() ? input.category.trim() : null,
    splitType: input.splitType,
    splits: shares.map((s) => ({
      user_id: s.userId,
      owed_amount: s.owedAmount,
    })),
    receiptUrl: input.receiptUrl ?? null,
  });
}

/**
 * Add an expense against a group or a friend. For a friend it resolves (or
 * creates) the direct group, so a "non-group" expense is just a direct-group
 * expense. Currency is derived from the group; participants come from `entries`.
 */
export async function addExpenseForTarget(input: {
  target: ExpenseTarget;
  description: string;
  amount: number;
  paidBy: string;
  category?: string | null;
  splitType: SplitType;
  entries: SplitEntry[];
  receiptFile?: File | null;
}): Promise<Expense> {
  let groupId: string;

  if (input.target.type === "group") {
    groupId = input.target.groupId;
  } else {
    groupId = await callEnsureDirectGroup(input.target.friendId);
  }

  const group = await groupsRepo.selectGroupById(groupId);
  if (!group) throw new Error("Group not found");

  // Upload the receipt once the group (and thus the storage path) is known.
  const receiptUrl = input.receiptFile
    ? await uploadReceipt(groupId, input.receiptFile)
    : null;

  return addExpense({
    groupId,
    description: input.description,
    amount: input.amount,
    currency: group.currency,
    paidBy: input.paidBy,
    category: input.category ?? null,
    splitType: input.splitType,
    entries: input.entries,
    receiptUrl,
  });
}

/** Expenses for a group, newest first, each with its splits attached. */
export async function listExpenses(
  groupId: string,
): Promise<ExpenseWithSplits[]> {
  const [expenses, splits] = await Promise.all([
    expensesRepo.selectExpensesByGroup(groupId),
    expensesRepo.selectSplitsByGroup(groupId),
  ]);

  const byExpense = new Map<string, ExpenseSplit[]>();
  for (const s of splits) {
    const list = byExpense.get(s.expense_id) ?? [];
    list.push(s);
    byExpense.set(s.expense_id, list);
  }

  return expenses.map((e) => ({ ...e, splits: byExpense.get(e.id) ?? [] }));
}

/** Net balance per member for a group, including recorded settlements. */
export async function getBalances(groupId: string): Promise<Balance[]> {
  const [expenses, splits, settlements] = await Promise.all([
    expensesRepo.selectExpensesByGroup(groupId),
    expensesRepo.selectSplitsByGroup(groupId),
    selectSettlementsByGroup(groupId),
  ]);

  return computeNetBalances({
    expenses: expenses.map((e) => ({ paidBy: e.paid_by, amount: e.amount })),
    splits: splits.map((s) => ({
      userId: s.user_id,
      owedAmount: s.owed_amount,
    })),
    settlements: settlements.map((s) => ({
      fromUser: s.from_user,
      toUser: s.to_user,
      amount: s.amount,
    })),
  });
}

export function deleteExpense(expenseId: string): Promise<void> {
  return expensesRepo.deleteExpense(expenseId);
}
