import { describe, expect, it } from "vitest";

import type { ProductVariant } from "../../api/products";
import {
  eligibleStorefrontTier,
  resolveStorefrontPricing,
  storefrontTierSchedule,
} from "./storefrontPricing";

const variant = {
  id: "sku-1",
  sku: "SKU-1",
  barcode: null,
  name: null,
  color: null,
  size: null,
  price: "90.00",
  regularPrice: "100.00",
  stockQuantity: 30,
  inStock: true,
  weight: null,
  isDefault: true,
  optionValues: [],
  priceTiers: [
    { id: "all-5", variantId: null, minimumQuantity: 5, unitPrice: "80.00", isPromotion: false },
    { id: "all-10", variantId: null, minimumQuantity: 10, unitPrice: "75.00", isPromotion: false },
    { id: "sku-10", variantId: "sku-1", minimumQuantity: 10, unitPrice: "70.00", isPromotion: true },
  ],
} satisfies ProductVariant;

describe("storefront quantity pricing", () => {
  it("keeps the active discount before a quantity tier is reached", () => {
    expect(resolveStorefrontPricing(variant, 2)).toMatchObject({
      unitPrice: 90,
      lineTotal: 180,
      savingsTotal: 20,
      source: "DISCOUNT",
      nextTier: { id: "all-5" },
    });
  });

  it("previews the tier that will actually win at the next threshold", () => {
    expect(resolveStorefrontPricing(variant, 6).nextTier?.id).toBe("sku-10");
  });

  it("applies the highest eligible quantity tier", () => {
    expect(resolveStorefrontPricing(variant, 10)).toMatchObject({
      unitPrice: 70,
      lineTotal: 700,
      savingsTotal: 300,
      discountPercentage: 30,
      source: "QUANTITY_TIER",
    });
  });

  it("prefers the exact SKU tier when quantity is tied", () => {
    expect(eligibleStorefrontTier(variant, 10)?.id).toBe("sku-10");
  });

  it("creates one accurate row for each quantity threshold", () => {
    expect(storefrontTierSchedule(variant)).toEqual([
      { minimumQuantity: 5, unitPrice: 80, isPromotion: false, variantId: null },
      { minimumQuantity: 10, unitPrice: 70, isPromotion: true, variantId: "sku-1" },
    ]);
  });
});
