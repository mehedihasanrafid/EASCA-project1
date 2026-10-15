import { describe, expect, it } from "vitest";
import {
  discountPercentageFromPrice,
  discountPriceFromPercentage,
} from "../utils/productEditor.validation";

describe("discount draft calculations", () => {
  it("calculates price from percentage", () => {
    expect(discountPriceFromPercentage("1000", "30")).toBe("700.00");
  });

  it("calculates percentage from price", () => {
    expect(discountPercentageFromPrice("1000", "700")).toBe("30");
  });

  it("rejects invalid percentages", () => {
    expect(discountPriceFromPercentage("1000", "101")).toBe("");
    expect(discountPercentageFromPrice("100", "120")).toBe("");
  });
});
