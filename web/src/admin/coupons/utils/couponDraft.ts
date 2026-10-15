import type { AdminCoupon, CouponDraft, SaveCouponInput } from "../types/coupon.types";

/** Returns a fresh form model so resets never reuse mutable state. */
export const createEmptyCouponDraft = (): CouponDraft => ({
  code: "",
  name: "",
  discountType: "PERCENTAGE",
  value: "",
  minimumSubtotal: "0",
  maximumDiscount: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perCustomerLimit: "1",
  isActive: true,
});

const toLocalDateTime = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const toApiDateTime = (value: string) => value ? new Date(value).toISOString() : null;

/** Maps an API record into browser-local form values for editing. */
export const couponToDraft = (coupon: AdminCoupon): CouponDraft => ({
  code: coupon.code,
  name: coupon.name,
  discountType: coupon.discountType,
  value: coupon.value,
  minimumSubtotal: coupon.minimumSubtotal,
  maximumDiscount: coupon.maximumDiscount ?? "",
  startsAt: toLocalDateTime(coupon.startsAt),
  endsAt: toLocalDateTime(coupon.endsAt),
  usageLimit: coupon.usageLimit === null ? "" : String(coupon.usageLimit),
  perCustomerLimit: String(coupon.perCustomerLimit),
  isActive: coupon.isActive,
});

/** Normalizes validated form values for the admin API. */
export const couponDraftToInput = (draft: CouponDraft): SaveCouponInput => ({
  code: draft.code.trim().toUpperCase(),
  name: draft.name.trim(),
  discountType: draft.discountType,
  value: Number(draft.value),
  minimumSubtotal: Number(draft.minimumSubtotal || 0),
  maximumDiscount: draft.maximumDiscount === "" ? null : Number(draft.maximumDiscount),
  startsAt: toApiDateTime(draft.startsAt),
  endsAt: toApiDateTime(draft.endsAt),
  usageLimit: draft.usageLimit === "" ? null : Number(draft.usageLimit),
  perCustomerLimit: Number(draft.perCustomerLimit),
  isActive: draft.isActive,
});
