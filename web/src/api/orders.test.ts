import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("./client", () => ({ apiClient }));

import { AdminOrder, Order, adminOrderApi, orderApi } from "./orders";

describe("orderApi", () => {
  beforeEach(() => apiClient.mockReset());

  it("loads an exact checkout preview for the selected address", async () => {
    const preview = { addressId: "3", grandTotal: "2080.00" };
    apiClient.mockResolvedValue({ preview });

    await expect(orderApi.previewCheckout("3")).resolves.toBe(preview);
    expect(apiClient).toHaveBeenCalledWith(
      "/orders/checkout-preview?addressId=3",
      { method: "GET" },
    );
  });

  it("checks out the active cart with an address and note", async () => {
    const order = { id: "9" } as Order;
    apiClient.mockResolvedValue({ order });

    await expect(orderApi.checkout("3", "Call before delivery")).resolves.toBe(order);
    expect(apiClient).toHaveBeenCalledWith("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({
        addressId: "3",
        customerNote: "Call before delivery",
      }),
    });
  });

  it("lists, loads and cancels customer orders", async () => {
    const order = { id: "9" } as Order;
    apiClient.mockResolvedValue({ orders: [], pagination: { page: 1 } });
    await orderApi.list({ page: 2, status: "PENDING" });
    expect(apiClient).toHaveBeenLastCalledWith(
      "/orders?page=2&status=PENDING",
      { method: "GET" },
    );

    apiClient.mockResolvedValue({ order });
    await orderApi.get("9");
    expect(apiClient).toHaveBeenLastCalledWith("/orders/9", { method: "GET" });

    await orderApi.cancel("9", "Changed my mind");
    expect(apiClient).toHaveBeenLastCalledWith("/orders/9/cancel", {
      method: "POST",
      body: JSON.stringify({ note: "Changed my mind" }),
    });
  });
});

describe("adminOrderApi", () => {
  beforeEach(() => apiClient.mockReset());

  it("filters orders and updates a status", async () => {
    apiClient.mockResolvedValue({ orders: [], pagination: { page: 1 } });
    await adminOrderApi.list({ search: "DBD-2026", status: "CONFIRMED" });
    expect(apiClient).toHaveBeenLastCalledWith(
      "/admin/orders?search=DBD-2026&status=CONFIRMED",
      { method: "GET" },
    );

    const order = { id: "9" } as AdminOrder;
    apiClient.mockResolvedValue({ order });
    await adminOrderApi.updateStatus("9", "SHIPPED", "Courier collected");
    expect(apiClient).toHaveBeenLastCalledWith("/admin/orders/9/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "SHIPPED", note: "Courier collected" }),
    });
  });
});
