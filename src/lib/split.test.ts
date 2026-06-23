import { describe, expect, it } from "vitest";
import {
  computeShares,
  splitByWeights,
  splitEqually,
  splitEquallyByUsers,
} from "./split";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("splitEqually", () => {
  it("splits evenly when divisible", () => {
    expect(splitEqually(9, 3)).toEqual([3, 3, 3]);
  });

  it("distributes leftover cents to the earliest shares", () => {
    expect(splitEqually(10, 3)).toEqual([3.34, 3.33, 3.33]);
  });

  it("always sums back to the original amount", () => {
    for (const [amount, n] of [
      [10, 3],
      [100, 7],
      [0.1, 3],
      [99.99, 4],
      [1, 6],
    ] as const) {
      expect(roundedSum(splitEqually(amount, n))).toBe(amount);
    }
  });

  it("handles a single participant", () => {
    expect(splitEqually(42.5, 1)).toEqual([42.5]);
  });

  it("handles amounts smaller than the participant count", () => {
    const shares = splitEqually(0.02, 5);
    expect(roundedSum(shares)).toBe(0.02);
    expect(shares).toEqual([0.01, 0.01, 0, 0, 0]);
  });

  it("throws with no participants", () => {
    expect(() => splitEqually(10, 0)).toThrow();
  });
});

describe("splitEquallyByUsers", () => {
  it("keys shares by user id and sums correctly", () => {
    const result = splitEquallyByUsers(10, ["a", "b", "c"]);
    expect(result).toEqual([
      { userId: "a", owedAmount: 3.34 },
      { userId: "b", owedAmount: 3.33 },
      { userId: "c", owedAmount: 3.33 },
    ]);
    expect(roundedSum(result.map((r) => r.owedAmount))).toBe(10);
  });
});

function roundedSum(xs: number[]): number {
  return Math.round(sum(xs) * 100) / 100;
}

describe("splitByWeights", () => {
  it("splits proportionally and sums to the amount", () => {
    expect(splitByWeights(100, [1, 1, 2])).toEqual([25, 25, 50]);
  });

  it("distributes leftover cents to the largest remainders", () => {
    const shares = splitByWeights(100, [1, 1, 1]);
    expect(roundedSum(shares)).toBe(100);
    expect(shares).toEqual([33.34, 33.33, 33.33]);
  });

  it("throws when total weight is zero", () => {
    expect(() => splitByWeights(10, [0, 0])).toThrow();
  });
});

describe("computeShares", () => {
  const users = ["a", "b"];

  it("equal", () => {
    expect(
      computeShares(
        10,
        "equal",
        users.map((userId) => ({ userId })),
      ),
    ).toEqual([
      { userId: "a", owedAmount: 5 },
      { userId: "b", owedAmount: 5 },
    ]);
  });

  it("exact must add up", () => {
    expect(
      computeShares(10, "exact", [
        { userId: "a", value: 7 },
        { userId: "b", value: 3 },
      ]),
    ).toEqual([
      { userId: "a", owedAmount: 7 },
      { userId: "b", owedAmount: 3 },
    ]);
    expect(() =>
      computeShares(10, "exact", [
        { userId: "a", value: 7 },
        { userId: "b", value: 2 },
      ]),
    ).toThrow();
  });

  it("percent must total 100", () => {
    expect(
      computeShares(200, "percent", [
        { userId: "a", value: 25 },
        { userId: "b", value: 75 },
      ]),
    ).toEqual([
      { userId: "a", owedAmount: 50 },
      { userId: "b", owedAmount: 150 },
    ]);
    expect(() =>
      computeShares(200, "percent", [
        { userId: "a", value: 25 },
        { userId: "b", value: 70 },
      ]),
    ).toThrow();
  });

  it("shares split by weight", () => {
    expect(
      computeShares(90, "shares", [
        { userId: "a", value: 1 },
        { userId: "b", value: 2 },
      ]),
    ).toEqual([
      { userId: "a", owedAmount: 30 },
      { userId: "b", owedAmount: 60 },
    ]);
  });
});
