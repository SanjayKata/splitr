import { describe, expect, it } from "vitest";
import { simplifyDebts } from "./simplify";

describe("simplifyDebts", () => {
  it("settles a simple two-person debt", () => {
    expect(
      simplifyDebts([
        { userId: "a", net: 10 },
        { userId: "b", net: -10 },
      ]),
    ).toEqual([{ from: "b", to: "a", amount: 10 }]);
  });

  it("minimizes transfers across several people", () => {
    // a +30, b -20, c -10  →  b pays a 20, c pays a 10 (2 transfers)
    const transfers = simplifyDebts([
      { userId: "a", net: 30 },
      { userId: "b", net: -20 },
      { userId: "c", net: -10 },
    ]);
    expect(transfers).toHaveLength(2);
    const total = transfers.reduce((s, t) => s + t.amount, 0);
    expect(total).toBe(30);
    expect(transfers.every((t) => t.to === "a")).toBe(true);
  });

  it("returns nothing when everyone is settled", () => {
    expect(
      simplifyDebts([
        { userId: "a", net: 0 },
        { userId: "b", net: 0 },
      ]),
    ).toEqual([]);
  });
});
