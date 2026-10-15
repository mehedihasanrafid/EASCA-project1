export type CouponDiscountType = "PERCENTAGE" | "FIXED";

/** Coupon record returned by the admin API. */
export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  discountType: CouponDiscountType;
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

/** Payload accepted by create and update coupon endpoints. */
export interface SaveCouponInput {
  code: string;
  name: string;
  discountType: CouponDiscountType;
  value: number;
  minimumSubtotal: number;
  maximumDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number;
  isActive: boolean;
}

/** Editable form values before conversion into an API payload. */
export interface CouponDraft {
  code: string;
  name: string;
  discountType: CouponDiscountType;
  value: string;
  minimumSubtotal: string;
  maximumDiscount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  isActive: boolean;
}

export type SetCouponDraftField = <Key extends keyof CouponDraft>(
  key: Key,
  value: CouponDraft[Key],
) => void;
