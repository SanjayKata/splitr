import { describe, expect, it } from "vitest";
import { addMemberSchema, createGroupSchema } from "./group";

describe("createGroupSchema", () => {
  it("accepts a valid group", () => {
    expect(
      createGroupSchema.safeParse({ name: "Goa Trip", currency: "INR" })
        .success,
    ).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(
      createGroupSchema.safeParse({ name: "  ", currency: "INR" }).success,
    ).toBe(false);
  });

  it("rejects a bad currency code", () => {
    expect(
      createGroupSchema.safeParse({ name: "Trip", currency: "RUPEE" }).success,
    ).toBe(false);
  });
});

describe("addMemberSchema", () => {
  it("accepts a valid email", () => {
    expect(addMemberSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(addMemberSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});
