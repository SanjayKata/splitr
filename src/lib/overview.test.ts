import { describe, expect, it } from "vitest";
import { buildOverview, netByFriendInGroup } from "./overview";

describe("netByFriendInGroup", () => {
  it("credits me when a friend shares an expense I paid", () => {
    // I (u) paid 30, split 3 ways (10 each) between u, a, b.
    const nets = netByFriendInGroup(
      "u",
      [{ id: "e1", paidBy: "u" }],
      [
        { expenseId: "e1", userId: "u", owedAmount: 10 },
        { expenseId: "e1", userId: "a", owedAmount: 10 },
        { expenseId: "e1", userId: "b", owedAmount: 10 },
      ],
    );
    expect(nets.get("a")).toBe(10);
    expect(nets.get("b")).toBe(10);
    expect(nets.has("u")).toBe(false);
  });

  it("debits me when I share an expense a friend paid", () => {
    const nets = netByFriendInGroup(
      "u",
      [{ id: "e1", paidBy: "a" }],
      [
        { expenseId: "e1", userId: "u", owedAmount: 10 },
        { expenseId: "e1", userId: "a", owedAmount: 10 },
      ],
    );
    expect(nets.get("a")).toBe(-10);
  });

  it("settlement I make reduces what I owe", () => {
    const nets = netByFriendInGroup(
      "u",
      [{ id: "e1", paidBy: "a" }],
      [
        { expenseId: "e1", userId: "u", owedAmount: 10 },
        { expenseId: "e1", userId: "a", owedAmount: 10 },
      ],
      [{ fromUser: "u", toUser: "a", amount: 10 }],
    );
    expect(nets.get("a")).toBe(0);
  });
});

describe("buildOverview", () => {
  const groups = [
    { id: "g1", name: "Trip", currency: "USD" },
    { id: "g2", name: "Flat", currency: "USD" },
    { id: "g3", name: "India", currency: "INR" },
  ];

  it("aggregates one friend across groups in the same currency", () => {
    const overview = buildOverview(
      "u",
      groups,
      [
        { id: "e1", groupId: "g1", paidBy: "u" }, // I paid in Trip
        { id: "e2", groupId: "g2", paidBy: "a" }, // friend paid in Flat
      ],
      [
        { expenseId: "e1", groupId: "g1", userId: "u", owedAmount: 10 },
        { expenseId: "e1", groupId: "g1", userId: "a", owedAmount: 10 }, // a owes me 10
        { expenseId: "e2", groupId: "g2", userId: "u", owedAmount: 4 }, // I owe a 4
        { expenseId: "e2", groupId: "g2", userId: "a", owedAmount: 4 },
      ],
    );

    const friend = overview.friends.find((f) => f.friendId === "a")!;
    const usd = friend.balances.find((b) => b.currency === "USD")!;
    expect(usd.net).toBe(6); // 10 owed to me − 4 I owe = net 6 in my favor
    expect(usd.groups).toHaveLength(2);
    expect(overview.totals).toEqual([
      { currency: "USD", youAreOwed: 6, youOwe: 0 },
    ]);
  });

  it("keeps different currencies separate", () => {
    const overview = buildOverview(
      "u",
      groups,
      [
        { id: "e1", groupId: "g1", paidBy: "u" },
        { id: "e3", groupId: "g3", paidBy: "a" },
      ],
      [
        { expenseId: "e1", groupId: "g1", userId: "a", owedAmount: 10 },
        { expenseId: "e1", groupId: "g1", userId: "u", owedAmount: 10 },
        { expenseId: "e3", groupId: "g3", userId: "u", owedAmount: 500 },
        { expenseId: "e3", groupId: "g3", userId: "a", owedAmount: 500 },
      ],
    );

    const friend = overview.friends.find((f) => f.friendId === "a")!;
    expect(friend.balances).toHaveLength(2);
    expect(friend.balances.find((b) => b.currency === "USD")!.net).toBe(10);
    expect(friend.balances.find((b) => b.currency === "INR")!.net).toBe(-500);

    const usd = overview.totals.find((t) => t.currency === "USD")!;
    const inr = overview.totals.find((t) => t.currency === "INR")!;
    expect(usd).toEqual({ currency: "USD", youAreOwed: 10, youOwe: 0 });
    expect(inr).toEqual({ currency: "INR", youAreOwed: 0, youOwe: 500 });
  });

  it("omits fully-settled friends", () => {
    const overview = buildOverview(
      "u",
      groups,
      [{ id: "e1", groupId: "g1", paidBy: "u" }],
      [
        { expenseId: "e1", groupId: "g1", userId: "u", owedAmount: 10 },
        { expenseId: "e1", groupId: "g1", userId: "a", owedAmount: 10 },
      ],
      [{ groupId: "g1", fromUser: "a", toUser: "u", amount: 10 }],
    );
    expect(overview.friends).toHaveLength(0);
    expect(overview.totals).toHaveLength(0);
  });
});
