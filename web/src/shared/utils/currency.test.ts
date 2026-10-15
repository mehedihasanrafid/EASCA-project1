import { describe, expect, it } from "vitest";
import { formatBdt } from "./currency";

describe("formatBdt", () => {
  it("formats numeric prices", () => {
    expect(formatBdt(1500)).toContain("1,500");
  });

  it("supports prices returned as strings", () => {
    expect(formatBdt("1500.50")).toBe(formatBdt(1500.5));
  });


  it("handles zero", () => {
    expect(formatBdt(0)).toContain("0");
  });
});
