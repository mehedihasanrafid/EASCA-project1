import { apiClient } from "../../../api/client";
import type { AdminCoupon, SaveCouponInput } from "../types/coupon.types";

/** Network boundary for the admin coupon feature. */
export const adminCouponApi = {
  list: (includeDeleted = true) => apiClient<{ coupons: AdminCoupon[] }>(
    `/admin/coupons?includeDeleted=${includeDeleted}`,
    { method: "GET" },
  ).then(({ coupons }) => coupons),

  create: (input: SaveCouponInput) => apiClient<{ coupon: AdminCoupon }>("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(input),
  }).then(({ coupon }) => coupon),

  update: (id: string, input: Partial<SaveCouponInput>) =>
    apiClient<{ coupon: AdminCoupon }>(`/admin/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(({ coupon }) => coupon),

  remove: (id: string) => apiClient<void>(`/admin/coupons/${id}`, {
    method: "DELETE",
  }),

  restore: (id: string) => apiClient<{ coupon: AdminCoupon }>(
    `/admin/coupons/${id}/restore`,
    { method: "POST" },
  ).then(({ coupon }) => coupon),
};
