import { describe, expect, it } from "vitest";

import {
  discountPercentageFromPrice,
  discountPriceFromPercentage,
} from "./discountDraft";

describe("discount draft calculations", () => {
  it("calculates a final price from percentage off", () => {
    expect(discountPriceFromPercentage("1000", "30")).toBe("700.00");
  });

  it("calculates percentage off from a final price", () => {
    expect(discountPercentageFromPrice("1000", "700")).toBe("30");
  });

  it("rejects percentages outside zero to one hundred", () => {
    expect(discountPriceFromPercentage("1000", "101")).toBe("");
    expect(discountPercentageFromPrice("100", "120")).toBe("");
  });
});
