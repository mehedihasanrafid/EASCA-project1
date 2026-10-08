import { describe, expect, it } from "vitest";

import {
  productSearchSuggestionsQuerySchema,
  publicProductListQuerySchema,
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
