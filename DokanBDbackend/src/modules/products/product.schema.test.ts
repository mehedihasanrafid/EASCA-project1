import { describe, expect, it } from "vitest";

import {
  createProductSchema,
  createProductVariantSchema,
  createProductVariantsBulkSchema,
  productSearchSuggestionsQuerySchema,
  publicProductListQuerySchema,
  replaceProductPriceTiersSchema,
  updateProductVariantSchema,
} from "./product.schema.js";

describe("product search suggestion validation", () => {
  it("trims the query and applies the default result limit", () => {
    expect(productSearchSuggestionsQuerySchema.parse({ q: "  sun  " })).toEqual({
      q: "sun",
      limit: 8,
    });
  });

  it("accepts a custom limit up to ten", () => {
    expect(productSearchSuggestionsQuerySchema.parse({ q: "shirt", limit: "10" })).toEqual({
      q: "shirt",
      limit: 10,
    });
  });

  it("rejects one-character searches and excessive limits", () => {
    expect(() => productSearchSuggestionsQuerySchema.parse({ q: "s" })).toThrow();
    expect(() => productSearchSuggestionsQuerySchema.parse({ q: "shirt", limit: 11 })).toThrow();
  });
});

describe("public product filter validation", () => {
  it("parses brand, stock, price, sorting, and pagination filters", () => {
    expect(
      publicProductListQuerySchema.parse({
        brand: "  dokanbd  ",
        inStock: "true",
        minPrice: "500",
        maxPrice: "3000",
        sort: "price_asc",
        page: "2",
      }),
    ).toMatchObject({
      brand: "dokanbd",
      inStock: true,
      minPrice: 500,
      maxPrice: 3000,
      sort: "price_asc",
      page: 2,
    });
  });

  it("preserves an explicit out-of-stock filter", () => {
    expect(publicProductListQuerySchema.parse({ inStock: "false" }).inStock).toBe(false);
  });

  it("rejects an inverted price range", () => {
    expect(() =>
      publicProductListQuerySchema.parse({ minPrice: "3000", maxPrice: "500" }),
    ).toThrow("minPrice cannot be greater than maxPrice");
  });
});

describe("bulk product variant validation", () => {
  it("accepts generated variants with normalized option value ids", () => {
    const result = createProductVariantsBulkSchema.parse({
      variants: [{
        sku: "SHIRT-BLACK-M",
        price: 1200,
        stockQuantity: 5,
        optionValueIds: ["1", "4"],
      }],
    });
    expect(result.variants[0]?.optionValueIds).toEqual(["1", "4"]);
  });

  it("requires at least one variant", () => {
    expect(() => createProductVariantsBulkSchema.parse({ variants: [] })).toThrow();
  });
});

describe("product variant dimension validation", () => {
  it("accepts metric dimensions on create and normalizes numeric strings", () => {
    const result = createProductVariantSchema.parse({
      sku: "DIMENSION-1",
      price: 900,
      lengthCm: "30",
      widthCm: "20.5",
      heightCm: 3,
    });

    expect(result).toMatchObject({
      lengthCm: 30,
      widthCm: 20.5,
      heightCm: 3,
    });
  });

  it("allows a dimension to be cleared and rejects negative dimensions", () => {
    expect(updateProductVariantSchema.parse({ lengthCm: null })).toEqual({
      lengthCm: null,
    });
    expect(() => createProductVariantSchema.parse({
      sku: "DIMENSION-INVALID",
      price: 900,
      heightCm: -1,
    })).toThrow();
  });
});

describe("product workbench pricing validation", () => {
  const product = {
    productTypeId: "1",
    categoryId: "1",
    name: "Scheduled product",
    description: "Product description",
    defaultPrice: 1000,
    discountPrice: 800,
  };

  it("accepts scheduled product and individual variant offers", () => {
    expect(createProductSchema.parse({
      ...product,
      discountStartsAt: "2026-10-12T04:00:00.000Z",
      discountEndsAt: "2026-10-20T04:00:00.000Z",
    }).discountPrice).toBe(800);
    expect(createProductVariantSchema.parse({
      sku: "SCHEDULED-1",
      price: 900,
      discountPrice: 750,
      discountStartsAt: "2026-10-12T04:00:00.000Z",
    }).discountPrice).toBe(750);
  });

  it("rejects inverted schedules and discounts above regular price", () => {
    expect(() => createProductSchema.parse({
      ...product,
      discountStartsAt: "2026-10-20T04:00:00.000Z",
      discountEndsAt: "2026-10-12T04:00:00.000Z",
    })).toThrow();
    expect(() => createProductVariantSchema.parse({
      sku: "INVALID-1",
      price: 900,
      discountPrice: 950,
    })).toThrow();
  });

  it("accepts all-variant and individual quantity price blocks", () => {
    const result = replaceProductPriceTiersSchema.parse({
      tiers: [
        { variantId: null, minimumQuantity: 10, unitPrice: 480, isPromotion: true },
        { variantId: "4", minimumQuantity: 20, unitPrice: 450 },
      ],
    });
    expect(result.tiers).toHaveLength(2);
    expect(result.tiers[0]?.isPromotion).toBe(true);
  });
});
