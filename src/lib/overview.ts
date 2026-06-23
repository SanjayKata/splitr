import { roundToCents } from "./money";

/**
 * Cross-group "friends" rollup.
 *
 * The pairwise balance between you and a friend is defined directly from
 * expenses: for an expense paid by P, each participant owes P their share. So
 * between you (U) and a friend (F):
 *
 *   net(F) = (F's shares of expenses U paid)  −  (U's shares of expenses F paid)
 *
 * Positive net = F owes you; negative = you owe F. Settlements adjust it.
 * Because it's pairwise, it adds up cleanly across groups — but only within the
 * same currency, so everything is bucketed by currency.
 */

export interface OverviewGroup {
  id: string;
  name: string;
  currency: string;
}
export interface OverviewExpense {
  id: string;
  groupId: string;
  paidBy: string;
}
export interface OverviewSplit {
  expenseId: string;
  groupId: string;
  userId: string;
  owedAmount: number;
}
export interface OverviewSettlement {
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
}

export interface FriendGroupEntry {
  groupId: string;
  groupName: string;
  net: number;
}
export interface FriendCurrencyBalance {
  currency: string;
  net: number;
  groups: FriendGroupEntry[];
}
export interface FriendBalance {
  friendId: string;
  balances: FriendCurrencyBalance[];
}
export interface CurrencyTotal {
  currency: string;
  youAreOwed: number;
  youOwe: number;
}
export interface Overview {
  friends: FriendBalance[];
  totals: CurrencyTotal[];
}

/**
 * Net amount between `userId` and each other user within a single group.
 * Positive = the other user owes `userId`.
 */
export function netByFriendInGroup(
  userId: string,
  expenses: { id: string; paidBy: string }[],
  splits: { expenseId: string; userId: string; owedAmount: number }[],
  settlements: { fromUser: string; toUser: string; amount: number }[] = [],
): Map<string, number> {
  const payerOf = new Map(expenses.map((e) => [e.id, e.paidBy]));
  const net = new Map<string, number>();
  const bump = (friend: string, delta: number) =>
    net.set(friend, (net.get(friend) ?? 0) + delta);

  for (const s of splits) {
    const payer = payerOf.get(s.expenseId);
    if (!payer || s.userId === payer) continue;
    if (payer === userId) {
      bump(s.userId, s.owedAmount); // friend owes me their share
    } else if (s.userId === userId) {
      bump(payer, -s.owedAmount); // I owe the payer my share
    }
  }

  for (const st of settlements) {
    if (st.fromUser === userId) bump(st.toUser, st.amount);
    else if (st.toUser === userId) bump(st.fromUser, -st.amount);
  }

  return net;
}

/** Build the cross-group overview for `userId`. */
export function buildOverview(
  userId: string,
  groups: OverviewGroup[],
  expenses: OverviewExpense[],
  splits: OverviewSplit[],
  settlements: OverviewSettlement[] = [],
): Overview {
  const groupById = new Map(groups.map((g) => [g.id, g]));

  // friendId -> currency -> { net, groups: groupId -> net }
  const acc = new Map<
    string,
    Map<string, { net: number; groups: Map<string, number> }>
  >();

  for (const group of groups) {
    const gExpenses = expenses.filter((e) => e.groupId === group.id);
    const gSplits = splits.filter((s) => s.groupId === group.id);
    const gSettlements = settlements.filter((s) => s.groupId === group.id);

    const nets = netByFriendInGroup(userId, gExpenses, gSplits, gSettlements);

    for (const [friendId, rawNet] of nets) {
      const net = roundToCents(rawNet);
      if (Math.abs(net) < 0.01) continue;

      const byCurrency = acc.get(friendId) ?? new Map();
      acc.set(friendId, byCurrency);
      const bucket = byCurrency.get(group.currency) ?? {
        net: 0,
        groups: new Map<string, number>(),
      };
      bucket.net = roundToCents(bucket.net + net);
      bucket.groups.set(group.id, net);
      byCurrency.set(group.currency, bucket);
    }
  }

  const friends: FriendBalance[] = [];
  for (const [friendId, byCurrency] of acc) {
    const balances: FriendCurrencyBalance[] = [];
    for (const [currency, bucket] of byCurrency) {
      if (Math.abs(bucket.net) < 0.01) continue;
      balances.push({
        currency,
        net: bucket.net,
        groups: [...bucket.groups.entries()].map(([groupId, net]) => ({
          groupId,
          groupName: groupById.get(groupId)?.name ?? "Group",
          net,
        })),
      });
    }
    if (balances.length > 0) friends.push({ friendId, balances });
  }

  // Per-currency totals.
  const totalsMap = new Map<string, CurrencyTotal>();
  for (const f of friends) {
    for (const b of f.balances) {
      const t = totalsMap.get(b.currency) ?? {
        currency: b.currency,
        youAreOwed: 0,
        youOwe: 0,
      };
      if (b.net > 0) t.youAreOwed = roundToCents(t.youAreOwed + b.net);
      else t.youOwe = roundToCents(t.youOwe - b.net);
      totalsMap.set(b.currency, t);
    }
  }

  return { friends, totals: [...totalsMap.values()] };
}
