import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("./client", () => ({ apiClient }));

import { catalogApi } from "./catalog";

describe("catalogApi", () => {
  beforeEach(() => apiClient.mockReset());

  it("unwraps public categories", async () => {
    const categories = [{ id: "1", name: "Accessories", slug: "accessories" }];
    apiClient.mockResolvedValue({ categories });

    await expect(catalogApi.getCategories()).resolves.toBe(categories);
    expect(apiClient).toHaveBeenCalledWith("/categories", {
      method: "GET",
      signal: undefined,
    });
  });

  it("unwraps public brands", async () => {
    const brands = [{ id: "1", name: "DokanBD", slug: "dokanbd" }];
    apiClient.mockResolvedValue({ brands });

    await expect(catalogApi.getBrands()).resolves.toBe(brands);
    expect(apiClient).toHaveBeenCalledWith("/brands", {
      method: "GET",
      signal: undefined,
    });
  });
});
