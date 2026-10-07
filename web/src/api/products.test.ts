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
    expect(apiClient).toHaveBeenCalledWith("/products?limit=12&sort=newest", { method: "GET" });
  });

  it("unwraps the product detail envelope", async () => {
    const product = { id: "1", slug: "shirt", name: "Shirt" };
    apiClient.mockResolvedValue({ product });

    await expect(productApi.getProductBySlug("shirt")).resolves.toBe(product);
    expect(apiClient).toHaveBeenCalledWith("/products/shirt", { method: "GET" });
  });
});
