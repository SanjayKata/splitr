import { describe, expect, it } from "vitest";
import { formatMoney, roundToCents } from "./money";

describe("roundToCents", () => {
  it("rounds to two decimals", () => {
    expect(roundToCents(1.005)).toBe(1.01);
    expect(roundToCents(2.345)).toBe(2.35);
  });

  it("avoids binary floating-point drift", () => {
    expect(roundToCents(0.1 + 0.2)).toBe(0.3);
  });
});

describe("formatMoney", () => {
  it("formats with the given currency", () => {
    expect(formatMoney(1234.5, "USD", "en-US")).toBe("$1,234.50");
  });

  it("rounds before formatting", () => {
    expect(formatMoney(9.999, "USD", "en-US")).toBe("$10.00");
  });
});
