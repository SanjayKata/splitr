import { roundToCents } from "./money";

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

/**
 * Minimize the number of payments needed to settle a set of net balances.
 *
 * Greedy "min cash flow": repeatedly match the largest debtor against the
 * largest creditor. Produces a small (near-minimal) set of transfers whose
 * net effect clears everyone. Input nets should sum to ~0 (per currency).
 */
export function simplifyDebts(
  balances: { userId: string; net: number }[],
): Transfer[] {
  const creditors = balances
    .filter((b) => b.net > 0.005)
    .map((b) => ({ id: b.userId, amt: b.net }))
    .sort((a, b) => b.amt - a.amt);
  const debtors = balances
    .filter((b) => b.net < -0.005)
    .map((b) => ({ id: b.userId, amt: -b.net }))
    .sort((a, b) => b.amt - a.amt);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    const amount = roundToCents(pay);
    if (amount > 0) {
      transfers.push({ from: debtors[i].id, to: creditors[j].id, amount });
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < 0.005) i++;
    if (creditors[j].amt < 0.005) j++;
  }
  return transfers;
}
