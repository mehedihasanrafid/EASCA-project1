import { describe, expect, it } from "vitest";

import {
  clearCatalogParameters,
  parseCatalogFilters,
  updateCatalogParameters,
} from "./catalogParams";

describe("catalog URL parameters", () => {
  it("parses valid filters and repairs unsafe URL values", () => {
    const filters = parseCatalogFilters(
      new URLSearchParams(
        "q=watch&category=accessories&brand=dokanbd&minPrice=500&maxPrice=3000&inStock=true&sort=price_asc&page=-4",
      ),
    );

    expect(filters).toEqual({
      search: "watch",
      category: "accessories",
      brand: "dokanbd",
      minPrice: 500,
      maxPrice: 3000,
      inStock: true,
      sort: "price_asc",
      page: 1,
      limit: 12,
    });
  });

  it("resets pagination when filters change and preserves unrelated filters", () => {
    const next = updateCatalogParameters(
      new URLSearchParams("q=watch&brand=dokanbd&page=4"),
      { category: "accessories" },
    );

    expect(next.toString()).toBe("q=watch&brand=dokanbd&page=1&category=accessories");
  });

  it("changes pages without resetting them and clears filters while keeping search", () => {
    const current = new URLSearchParams("q=watch&brand=dokanbd&page=4");
    expect(updateCatalogParameters(current, { page: 2 }).get("page")).toBe("2");
    expect(clearCatalogParameters(current).toString()).toBe("q=watch");
  });
});
