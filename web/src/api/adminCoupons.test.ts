import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("./client", () => ({ apiClient }));

import { AdminCoupon, SaveCouponInput, adminCouponApi } from "./adminCoupons";

const input: SaveCouponInput = {
  code: "SAVE10",
  name: "Ten percent off",
  discountType: "PERCENTAGE",
  value: 10,
  minimumSubtotal: 1000,
  maximumDiscount: 500,
  startsAt: null,
  endsAt: null,
  usageLimit: 100,
  perCustomerLimit: 1,
  isActive: true,
};

describe("adminCouponApi", () => {
  beforeEach(() => apiClient.mockReset());

  it("lists active and archived coupons", async () => {
    apiClient.mockResolvedValue({ coupons: [] });

    await expect(adminCouponApi.list()).resolves.toEqual([]);
    expect(apiClient).toHaveBeenCalledWith(
      "/admin/coupons?includeDeleted=true",
      { method: "GET" },
    );
  });

  it("creates, updates, archives and restores a coupon", async () => {
    const coupon = { id: "coupon-1", ...input } as unknown as AdminCoupon;
    apiClient.mockResolvedValue({ coupon });

    await expect(adminCouponApi.create(input)).resolves.toBe(coupon);
    expect(apiClient).toHaveBeenLastCalledWith("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(input),
    });

    await adminCouponApi.update("coupon-1", { isActive: false });
    expect(apiClient).toHaveBeenLastCalledWith("/admin/coupons/coupon-1", {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });

    apiClient.mockResolvedValue(undefined);
    await adminCouponApi.remove("coupon-1");
    expect(apiClient).toHaveBeenLastCalledWith("/admin/coupons/coupon-1", {
      method: "DELETE",
    });

    apiClient.mockResolvedValue({ coupon });
    await expect(adminCouponApi.restore("coupon-1")).resolves.toBe(coupon);
    expect(apiClient).toHaveBeenLastCalledWith("/admin/coupons/coupon-1/restore", {
      method: "POST",
    });
  });
});
