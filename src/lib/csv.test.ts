import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("joins rows and columns", () => {
    expect(
      toCsv([
        ["Date", "Amount"],
        ["Jun 22", 100],
      ]),
    ).toBe("Date,Amount\nJun 22,100");
  });

  it("quotes cells with commas, quotes or newlines", () => {
    expect(toCsv([["a,b", 'he said "hi"']])).toBe('"a,b","he said ""hi"""');
  });
});
