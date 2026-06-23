import { getSupabaseClient } from "@/lib/supabase/client";
import type { Expense, ExpenseSplit, SplitType } from "@/types/database";

/** Data access for expenses and their splits. Only this layer touches the DB. */

export interface NewExpense {
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  category: string | null;
  splitType: SplitType;
  splits: { user_id: string; owed_amount: number }[];
  receiptUrl?: string | null;
}

/** Atomically create an expense and its splits via the create_expense RPC. */
export async function callCreateExpense(input: NewExpense): Promise<Expense> {
  const supabase = getSupabaseClient();
  // Only send _receipt_url when present, so this stays compatible with the
  // pre-0005 function signature (no receipt param) and expenses keep working
  // until migration 0005 is applied.
  const { data, error } = await supabase.rpc("create_expense", {
    _group_id: input.groupId,
    _description: input.description,
    _amount: input.amount,
    _currency: input.currency,
    _paid_by: input.paidBy,
    _category: input.category,
    _split_type: input.splitType,
    _splits: input.splits,
    ...(input.receiptUrl != null ? { _receipt_url: input.receiptUrl } : {}),
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function selectExpensesByGroup(
  groupId: string,
): Promise<Expense[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function selectSplitsByGroup(
  groupId: string,
): Promise<ExpenseSplit[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("expense_splits")
    .select("*")
    .eq("group_id", groupId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function selectExpensesByGroups(
  groupIds: string[],
): Promise<Expense[]> {
  if (groupIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .in("group_id", groupIds);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function selectSplitsByGroups(
  groupIds: string[],
): Promise<ExpenseSplit[]> {
  if (groupIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("expense_splits")
    .select("*")
    .in("group_id", groupIds);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);
  if (error) throw new Error(error.message);
}
