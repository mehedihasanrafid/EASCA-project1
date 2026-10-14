import { describe, expect, it } from "vitest";

import {
  editableQuantityFromInput,
  purchasableQuantity,
} from "./productQuantity";

describe("product quantity input", () => {
  it("allows the customer to clear 1 before typing a replacement", () => {
    expect(editableQuantityFromInput("", 20)).toBe("");
  });

  it.each([2, 3, 4, 5])("accepts the direct quantity %i", (quantity) => {
    expect(editableQuantityFromInput(String(quantity), 20)).toBe(quantity);
  });

  it("keeps the quantity inside one and available stock", () => {
    expect(editableQuantityFromInput("0", 10)).toBe(1);
    expect(editableQuantityFromInput("25", 10)).toBe(10);
  });

  it("uses one if an empty field is submitted or loses focus", () => {
    expect(purchasableQuantity("", 10)).toBe(1);
  });
});
