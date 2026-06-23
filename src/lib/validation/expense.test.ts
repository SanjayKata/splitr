import { describe, expect, it } from "vitest";
import { addExpenseSchema } from "./expense";

const base = {
  description: "Dinner",
  amount: "30",
  paidBy: "user-1",
  participantIds: ["user-1", "user-2"],
};

describe("addExpenseSchema", () => {
  it("accepts a valid expense", () => {
    expect(addExpenseSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    expect(addExpenseSchema.safeParse({ ...base, amount: "0" }).success).toBe(
      false,
    );
  });

  it("rejects more than 2 decimal places", () => {
    expect(
      addExpenseSchema.safeParse({ ...base, amount: "10.999" }).success,
    ).toBe(false);
  });

  it("rejects when no participants are selected", () => {
    expect(
      addExpenseSchema.safeParse({ ...base, participantIds: [] }).success,
    ).toBe(false);
  });

  it("requires a payer", () => {
    expect(addExpenseSchema.safeParse({ ...base, paidBy: "" }).success).toBe(
      false,
    );
  });
});
