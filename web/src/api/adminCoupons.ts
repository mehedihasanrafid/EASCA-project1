import { apiClient } from "./client";

export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: string;
  minimumSubtotal: string;
  maximumDiscount: string | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SaveCouponInput {
  code: string;
  name: string;
  discountType: AdminCoupon["discountType"];
  value: number;
  minimumSubtotal: number;
  maximumDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number;
  isActive: boolean;
}

export const adminCouponApi = {
  list: (includeDeleted = true) => apiClient<{ coupons: AdminCoupon[] }>(
    `/admin/coupons?includeDeleted=${includeDeleted}`,
    { method: "GET" },
  ).then(({ coupons }) => coupons),
  create: (input: SaveCouponInput) => apiClient<{ coupon: AdminCoupon }>("/admin/coupons", {
    method: "POST", body: JSON.stringify(input),
  }).then(({ coupon }) => coupon),
  update: (id: string, input: Partial<SaveCouponInput>) => apiClient<{ coupon: AdminCoupon }>(`/admin/coupons/${id}`, {
    method: "PATCH", body: JSON.stringify(input),
  }).then(({ coupon }) => coupon),
  remove: (id: string) => apiClient<void>(`/admin/coupons/${id}`, { method: "DELETE" }),
  restore: (id: string) => apiClient<{ coupon: AdminCoupon }>(`/admin/coupons/${id}/restore`, { method: "POST" }).then(({ coupon }) => coupon),
};
