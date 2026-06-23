import { roundToCents } from "./money";

export interface ExpenseInput {
  paidBy: string;
  amount: number;
}

export interface SplitInput {
  userId: string;
  owedAmount: number;
}

export interface SettlementInput {
  fromUser: string;
  toUser: string;
  amount: number;
}

export interface Balance {
  userId: string;
  /** Net position: positive = owed to them, negative = they owe. */
  net: number;
}

/**
 * Net balance per user across a group.
 *
 *   net = (amounts they paid) − (their shares of expenses) + (settlement effect)
 *
 * A settlement from A to B is A paying back B: it raises A's net and lowers B's.
 * Returned only for users who appear, rounded to cents.
 */
export function computeNetBalances(input: {
  expenses: ExpenseInput[];
  splits: SplitInput[];
  settlements?: SettlementInput[];
}): Balance[] {
  const net = new Map<string, number>();
  const add = (userId: string, delta: number) =>
    net.set(userId, (net.get(userId) ?? 0) + delta);

  for (const e of input.expenses) add(e.paidBy, e.amount);
  for (const s of input.splits) add(s.userId, -s.owedAmount);
  for (const s of input.settlements ?? []) {
    add(s.fromUser, s.amount);
    add(s.toUser, -s.amount);
  }

  return [...net.entries()].map(([userId, value]) => ({
    userId,
    net: roundToCents(value),
  }));
}
