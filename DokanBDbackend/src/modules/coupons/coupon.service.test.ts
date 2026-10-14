import { describe, expect, it } from "vitest";
import type { Coupon } from "./coupon.entity.js";
import { couponDiscount, formatCouponMoney } from "./coupon.service.js";

const coupon = (input: Partial<Coupon>) => ({
  discountType: "PERCENTAGE", value: "10.00", maximumDiscount: null, ...input,
}) as Coupon;

describe("coupon discount calculation", () => {
  it("calculates percentage and fixed discounts in minor units", () => {
    expect(formatCouponMoney(couponDiscount(coupon({}), 250_000n))).toBe("250.00");
    expect(formatCouponMoney(couponDiscount(coupon({ discountType: "FIXED", value: "300.00" }), 250_000n))).toBe("300.00");
  });

  it("honors the cap and never makes a subtotal negative", () => {
    expect(couponDiscount(coupon({ value: "50.00", maximumDiscount: "200.00" }), 100_000n)).toBe(20_000n);
    expect(couponDiscount(coupon({ discountType: "FIXED", value: "5000.00" }), 100_000n)).toBe(100_000n);
  });
});
