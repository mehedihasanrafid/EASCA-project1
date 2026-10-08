import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { BrandOption, CategoryOption } from "../../../api/catalog";
import type { CatalogFilters as CatalogFilterValues } from "../types/catalog";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { CatalogFilters } from "./CatalogFilters";
import { CategoryNavigation } from "./CategoryNavigation";

const categories: CategoryOption[] = [
  {
    id: "2",
    parentId: null,
    name: "Accessories",
    slug: "accessories",
    description: null,
    imageUrl: null,
    displayImageUrl: "/uploads/products/sunglasses.webp",
    productCount: 3,
    sortOrder: 1,
    showOnHomepage: true,
    children: [],
  },
];

const brands: BrandOption[] = [
  { id: "1", name: "DokanBD", slug: "dokanbd", logoUrl: null },
];

const filters: CatalogFilterValues = {
  category: "accessories",
  brand: "dokanbd",
  minPrice: 500,
  maxPrice: 3000,
  inStock: true,
  sort: "newest",
  page: 1,
  limit: 12,
};

describe("catalog discovery components", () => {
  it("renders typed category, brand, price, and stock controls", () => {
    const html = renderToStaticMarkup(
      <CatalogFilters
        brands={brands}
        categories={categories}
        filters={filters}
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain("Category");
    expect(html).toContain("Accessories");
    expect(html).toContain("DokanBD");
    expect(html).toContain("Minimum price");
    expect(html).toContain("In-stock products only");
  });

  it("renders removable active-filter descriptions", () => {
    const html = renderToStaticMarkup(
      <ActiveFilterChips
        brands={brands}
        categories={categories}
        filters={filters}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(html).toContain("Category: Accessories");
    expect(html).toContain("Brand: DokanBD");
    expect(html).toContain("In stock");
    expect(html).toContain("Clear filters");
  });

  it("links homepage categories to shareable catalog URLs", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CategoryNavigation categories={categories} />
      </MemoryRouter>,
    );

    expect(html).toContain("Shop by category");
    expect(html).toContain("/search?category=accessories");
    expect(html).toContain("/uploads/products/sunglasses.webp");
    expect(html).toContain("3 products");
    expect(html).toContain("Previous category");
    expect(html).toContain("Next category");
  });
});
