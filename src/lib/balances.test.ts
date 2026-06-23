import { describe, expect, it } from "vitest";
import { computeNetBalances } from "./balances";

const byId = (bs: { userId: string; net: number }[]) =>
  Object.fromEntries(bs.map((b) => [b.userId, b.net]));

describe("computeNetBalances", () => {
  it("credits the payer and debits each share", () => {
    // Alice pays 30, split equally three ways (10 each).
    const balances = byId(
      computeNetBalances({
        expenses: [{ paidBy: "alice", amount: 30 }],
        splits: [
          { userId: "alice", owedAmount: 10 },
          { userId: "bob", owedAmount: 10 },
          { userId: "carol", owedAmount: 10 },
        ],
      }),
    );
    expect(balances).toEqual({ alice: 20, bob: -10, carol: -10 });
  });

  it("nets out to zero across everyone", () => {
    const balances = computeNetBalances({
      expenses: [
        { paidBy: "a", amount: 40 },
        { paidBy: "b", amount: 20 },
      ],
      splits: [
        { userId: "a", owedAmount: 20 },
        { userId: "b", owedAmount: 20 },
        { userId: "c", owedAmount: 20 },
      ],
    });
    const total = balances.reduce((s, b) => s + b.net, 0);
    expect(Math.round(total * 100) / 100).toBe(0);
  });

  it("applies settlements: payer's debt shrinks", () => {
    // Bob owes 10, then pays Alice 10 → everyone settled.
    const balances = byId(
      computeNetBalances({
        expenses: [{ paidBy: "alice", amount: 20 }],
        splits: [
          { userId: "alice", owedAmount: 10 },
          { userId: "bob", owedAmount: 10 },
        ],
        settlements: [{ fromUser: "bob", toUser: "alice", amount: 10 }],
      }),
    );
    expect(balances).toEqual({ alice: 0, bob: 0 });
  });
});
