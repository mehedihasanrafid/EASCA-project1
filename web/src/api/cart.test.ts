import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("./client", () => ({ apiClient }));

import { Cart, cartApi } from "./cart";

const cart = {
  id: "1",
  status: "ACTIVE",
  items: [],
  totals: {
    itemCount: 0,
    totalQuantity: 0,
    subtotal: "0.00",
    currency: "BDT",
  },
  createdAt: "2026-10-07T00:00:00.000Z",
  updatedAt: "2026-10-07T00:00:00.000Z",
} satisfies Cart;

describe("cartApi", () => {
  beforeEach(() => {
    apiClient.mockReset();
    apiClient.mockResolvedValue({ cart });
  });

  it("loads the active cart", async () => {
    await expect(cartApi.getCart()).resolves.toBe(cart);
    expect(apiClient).toHaveBeenCalledWith("/cart", { method: "GET" });
  });

  it("adds a product variant", async () => {
    await cartApi.addItem("17", 2);
    expect(apiClient).toHaveBeenCalledWith("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productVariantId: "17", quantity: 2 }),
    });
  });

  it("updates an item quantity", async () => {
    await cartApi.updateItem("8", 3);
    expect(apiClient).toHaveBeenCalledWith("/cart/items/8", {
      method: "PATCH",
      body: JSON.stringify({ quantity: 3 }),
    });
  });

  it("removes one item", async () => {
    await cartApi.removeItem("8");
    expect(apiClient).toHaveBeenCalledWith("/cart/items/8", { method: "DELETE" });
  });

  it("clears the cart", async () => {
    await cartApi.clearCart();
    expect(apiClient).toHaveBeenCalledWith("/cart/items", { method: "DELETE" });
  });
});
