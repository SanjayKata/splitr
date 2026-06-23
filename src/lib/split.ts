import { roundToCents } from "./money";
import type { SplitType } from "@/types/database";

/**
 * Split an amount equally into `count` shares that sum *exactly* to the amount.
 *
 * Works in integer minor units (cents) to avoid floating-point drift, then
 * distributes any leftover cents one-by-one to the earliest shares. E.g.
 * 10.00 / 3 → [3.34, 3.33, 3.33].
 */
export function splitEqually(amount: number, count: number): number[] {
  if (count <= 0) throw new Error("Need at least one participant");

  const totalCents = Math.round(roundToCents(amount) * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count; // 0..count-1 extra cents

  return Array.from({ length: count }, (_, i) => {
    const cents = base + (i < remainder ? 1 : 0);
    return cents / 100;
  });
}

export interface UserShare {
  userId: string;
  owedAmount: number;
}

/** Equal split keyed by participant ids (order preserved). */
export function splitEquallyByUsers(
  amount: number,
  userIds: string[],
): UserShare[] {
  const shares = splitEqually(amount, userIds.length);
  return userIds.map((userId, i) => ({ userId, owedAmount: shares[i] }));
}

/**
 * Split an amount proportionally to non-negative weights, summing exactly to the
 * amount. Leftover cents go to the largest fractional remainders. Used for both
 * percentage and share-based splits.
 */
export function splitByWeights(amount: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) throw new Error("Total weight must be greater than 0");

  const totalCents = Math.round(roundToCents(amount) * 100);
  const raw = weights.map((w) => (totalCents * w) / totalWeight);
  const cents = raw.map(Math.floor);
  let remainder = totalCents - cents.reduce((a, b) => a + b, 0);

  // Hand out the leftover cents to the biggest fractional parts first.
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; remainder > 0; k++, remainder--) {
    cents[order[k % order.length].i] += 1;
  }

  return cents.map((c) => c / 100);
}

/** One participant's input for a custom split (value meaning depends on type). */
export interface SplitEntry {
  userId: string;
  /** exact amount, percentage, or share count — ignored for "equal". */
  value?: number;
}

/**
 * Resolve the final owed amount per participant for a given split type.
 * Throws a clear error when the inputs are inconsistent (e.g. exact amounts
 * that don't add up, or percentages that aren't 100).
 */
export function computeShares(
  amount: number,
  splitType: SplitType,
  entries: SplitEntry[],
): UserShare[] {
  if (entries.length === 0) throw new Error("Add at least one participant");
  const total = roundToCents(amount);

  switch (splitType) {
    case "equal":
      return splitEquallyByUsers(
        amount,
        entries.map((e) => e.userId),
      );

    case "exact": {
      const shares = entries.map((e) => ({
        userId: e.userId,
        owedAmount: roundToCents(e.value ?? 0),
      }));
      const sum = roundToCents(shares.reduce((a, s) => a + s.owedAmount, 0));
      if (sum !== total) {
        throw new Error("The exact amounts must add up to the total");
      }
      return shares;
    }

    case "percent": {
      const pct = entries.map((e) => e.value ?? 0);
      if (pct.some((p) => p < 0))
        throw new Error("Percentages can't be negative");
      const sum = Math.round(pct.reduce((a, b) => a + b, 0) * 100) / 100;
      if (sum !== 100) throw new Error("Percentages must add up to 100%");
      const amounts = splitByWeights(amount, pct);
      return entries.map((e, i) => ({
        userId: e.userId,
        owedAmount: amounts[i],
      }));
    }

    case "shares": {
      const sh = entries.map((e) => e.value ?? 0);
      if (sh.some((s) => s < 0)) throw new Error("Shares can't be negative");
      const amounts = splitByWeights(amount, sh);
      return entries.map((e, i) => ({
        userId: e.userId,
        owedAmount: amounts[i],
      }));
    }
  }
}
