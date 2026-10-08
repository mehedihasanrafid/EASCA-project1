import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("./client", () => ({ apiClient }));

import { productApi } from "./products";

describe("productApi", () => {
  beforeEach(() => apiClient.mockReset());

  it("preserves the backend product and pagination envelope", async () => {
    const response = {
      products: [{ id: "1", name: "Shirt" }],
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
    };
    apiClient.mockResolvedValue(response);

    await expect(productApi.getProducts({ limit: 12, sort: "newest" })).resolves.toBe(response);
    expect(apiClient).toHaveBeenCalledWith("/products?limit=12&sort=newest", {
      method: "GET",
      signal: undefined,
    });
  });

  it("serializes complete public catalog filters", async () => {
    apiClient.mockResolvedValue({
      products: [],
      pagination: { page: 2, limit: 12, total: 0, totalPages: 0 },
    });

    await productApi.getProducts({
      search: "watch",
      category: "accessories",
      brand: "dokanbd",
      minPrice: 500,
      maxPrice: 3000,
      inStock: true,
      sort: "price_asc",
      page: 2,
      limit: 12,
    });

    expect(apiClient).toHaveBeenCalledWith(
      "/products?search=watch&category=accessories&brand=dokanbd&minPrice=500&maxPrice=3000&inStock=true&sort=price_asc&page=2&limit=12",
      { method: "GET", signal: undefined },
    );
  });

  it("unwraps the product detail envelope", async () => {
    const product = { id: "1", slug: "shirt", name: "Shirt" };
    apiClient.mockResolvedValue({ product });

    await expect(productApi.getProductBySlug("shirt")).resolves.toBe(product);
    expect(apiClient).toHaveBeenCalledWith("/products/shirt", { method: "GET" });
  });

  it("loads trimmed, limited product search suggestions", async () => {
    const suggestions = [{ id: "1", slug: "shirt", name: "Shirt" }];
    apiClient.mockResolvedValue({ suggestions });

    await expect(productApi.getSearchSuggestions("  shi  ", 6)).resolves.toBe(suggestions);
    expect(apiClient).toHaveBeenCalledWith(
      "/products/search-suggestions?q=shi&limit=6",
      { method: "GET", signal: undefined },
    );
  });
});
