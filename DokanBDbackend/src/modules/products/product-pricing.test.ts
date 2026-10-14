import { describe, expect, it } from "vitest";

import type { ProductPriceTier } from "./product-price-tier.entity.js";
import type { ProductVariant } from "./product-variant.entity.js";
import {
  activeDiscountPrice,
  effectiveVariantPrice,
  effectiveVariantPricing,
} from "./product-pricing.js";

describe("product workbench effective pricing", () => {
  it("applies a scheduled discount only inside its active window", () => {
    expect(activeDiscountPrice(
      "1000.00",
      "800.00",
      "2026-10-10T00:00:00.000Z",
      "2026-10-20T00:00:00.000Z",
      new Date("2026-10-12T00:00:00.000Z"),
    )).toBe("800.00");
    expect(activeDiscountPrice(
      "1000.00",
      "800.00",
      "2026-10-13T00:00:00.000Z",
      null,
      new Date("2026-10-12T00:00:00.000Z"),
    )).toBe("1000.00");
  });

  it("uses the highest eligible quantity block for a variant", () => {
    const variant = {
      id: "8",
      productId: "product-1",
      price: "100.00",
      discountPrice: "90.00",
      discountStartsAt: null,
      discountEndsAt: null,
    } as ProductVariant;
    const tiers = [
      { productId: "product-1", variantId: null, minimumQuantity: 10, unitPrice: "80.00", isActive: true },
      { productId: "product-1", variantId: "8", minimumQuantity: 20, unitPrice: "70.00", isActive: true },
    ] as ProductPriceTier[];

    expect(effectiveVariantPrice(variant, 1, tiers)).toBe("90.00");
    expect(effectiveVariantPrice(variant, 10, tiers)).toBe("80.00");
    expect(effectiveVariantPrice(variant, 20, tiers)).toBe("70.00");
  });

  it("returns a customer-facing explanation for the effective price", () => {
    const variant = {
      id: "8",
      productId: "product-1",
      price: "100.00",
      discountPrice: "90.00",
      discountStartsAt: null,
      discountEndsAt: null,
    } as ProductVariant;
    const tiers = [
      { id: "1", productId: "product-1", variantId: null, minimumQuantity: 5, unitPrice: "80.00", isActive: true, isPromotion: true },
    ] as ProductPriceTier[];

    expect(effectiveVariantPricing(variant, 1, tiers)).toMatchObject({
      regularUnitPrice: "100.00",
      baseUnitPrice: "90.00",
      unitPrice: "90.00",
      source: "DISCOUNT",
      tier: null,
    });
    expect(effectiveVariantPricing(variant, 5, tiers)).toMatchObject({
      regularUnitPrice: "100.00",
      baseUnitPrice: "90.00",
      unitPrice: "80.00",
      source: "QUANTITY_TIER",
      tier: { id: "1", minimumQuantity: 5, isPromotion: true },
    });
  });

  it("prefers an exact SKU tier when quantity and price are tied", () => {
    const variant = {
      id: "8",
      productId: "product-1",
      price: "100.00",
      discountPrice: null,
      discountStartsAt: null,
      discountEndsAt: null,
    } as ProductVariant;
    const tiers = [
      { id: "all", productId: "product-1", variantId: null, minimumQuantity: 5, unitPrice: "80.00", isActive: true },
      { id: "sku", productId: "product-1", variantId: "8", minimumQuantity: 5, unitPrice: "80.00", isActive: true },
    ] as ProductPriceTier[];

    expect(effectiveVariantPricing(variant, 5, tiers).tier?.id).toBe("sku");
  });

  it("never applies a product-wide tier from another product", () => {
    const variant = {
      id: "8",
      productId: "product-1",
      price: "100.00",
      discountPrice: null,
      discountStartsAt: null,
      discountEndsAt: null,
    } as ProductVariant;
    const tiers = [
      { productId: "product-2", variantId: null, minimumQuantity: 2, unitPrice: "1.00", isActive: true },
    ] as ProductPriceTier[];

    expect(effectiveVariantPrice(variant, 2, tiers)).toBe("100.00");
  });
});
