import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "x" }).success,
    ).toBe(true);
  });

  it("rejects a bad email", () => {
    const r = loginSchema.safeParse({ email: "nope", password: "x" });
    expect(r.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    expect(
      signupSchema.safeParse({
        displayName: "Sam",
        email: "a@b.com",
        password: "longenough",
      }).success,
    ).toBe(true);
  });

  it("rejects a short password", () => {
    const r = signupSchema.safeParse({
      displayName: "Sam",
      email: "a@b.com",
      password: "short",
    });
    expect(r.success).toBe(false);
  });

  it("requires a display name", () => {
    const r = signupSchema.safeParse({
      displayName: "   ",
      email: "a@b.com",
      password: "longenough",
    });
    expect(r.success).toBe(false);
  });
});
