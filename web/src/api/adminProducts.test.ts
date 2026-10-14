import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("./client", () => ({ apiClient }));

import { adminProductApi } from "./adminProducts";

describe("adminProductApi", () => {
  beforeEach(() => apiClient.mockReset());

  it("loads the unfiltered active catalog by default", async () => {
    const response = { products: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } };
    apiClient.mockResolvedValue(response);

    await expect(adminProductApi.getProducts()).resolves.toBe(response);
    expect(apiClient).toHaveBeenCalledWith(
      "/admin/products?limit=100&includeDeleted=false",
      { method: "GET" },
    );
  });

  it("trims and safely encodes the product search", async () => {
    apiClient.mockResolvedValue({ products: [], pagination: {} });

    await adminProductApi.getProducts("  cotton & silk  ");

    expect(apiClient).toHaveBeenCalledWith(
      "/admin/products?limit=100&includeDeleted=false&search=cotton%20%26%20silk",
      { method: "GET" },
    );
  });
});
