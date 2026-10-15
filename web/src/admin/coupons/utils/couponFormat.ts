import type { AdminCoupon } from "../types/coupon.types";

const numberFormatter = new Intl.NumberFormat("en-BD");

const formatBdt = (value: string | number) => `BDT ${numberFormatter.format(Number(value))}`;

export const formatCouponOffer = (coupon: AdminCoupon) =>
  coupon.discountType === "PERCENTAGE"
    ? `${Number(coupon.value)}% off`
    : `${formatBdt(coupon.value)} off`;

export const formatCouponRequirements = (coupon: AdminCoupon) => {
  const minimum = `Minimum ${formatBdt(coupon.minimumSubtotal)}`;
  const cap = coupon.maximumDiscount === null
    ? ""
    : ` · cap ${formatBdt(coupon.maximumDiscount)}`;
  return `${minimum}${cap}`;
};

export const formatCouponStart = (coupon: AdminCoupon) =>
  coupon.startsAt ? new Date(coupon.startsAt).toLocaleString() : "Immediately";

export const formatCouponEnd = (coupon: AdminCoupon) =>
  coupon.endsAt ? `Until ${new Date(coupon.endsAt).toLocaleString()}` : "No expiry";

export interface CouponStatus {
  label: "Archived" | "Expired" | "Active" | "Paused";
  active: boolean;
}

/** Status precedence mirrors the lifecycle shown to administrators. */
export const getCouponStatus = (coupon: AdminCoupon, now = new Date()): CouponStatus => {
  if (coupon.deletedAt) return { label: "Archived", active: false };
  if (coupon.endsAt && new Date(coupon.endsAt) < now) return { label: "Expired", active: false };
  if (coupon.isActive) return { label: "Active", active: true };
  return { label: "Paused", active: false };
};
