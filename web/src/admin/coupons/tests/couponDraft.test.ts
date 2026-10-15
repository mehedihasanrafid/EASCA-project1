import { describe, expect, it } from "vitest";

import type { AdminCoupon, CouponDraft } from "../types/coupon.types";
import { couponDraftToInput, couponToDraft } from "../utils/couponDraft";

const draft: CouponDraft = {
  code: " save10 ",
  name: " October offer ",
  discountType: "PERCENTAGE",
  value: "10",
  minimumSubtotal: "1000",
  maximumDiscount: "",
  startsAt: "2026-10-13T12:00",
  endsAt: "",
  usageLimit: "",
  perCustomerLimit: "1",
  isActive: true,
};

describe("coupon draft mapping", () => {
  it("normalizes form values into the strict API payload", () => {
    const input = couponDraftToInput(draft);

    expect(input).toMatchObject({
      code: "SAVE10",
      name: "October offer",
      value: 10,
      minimumSubtotal: 1000,
      maximumDiscount: null,
      endsAt: null,
      usageLimit: null,
      perCustomerLimit: 1,
    });
    expect(input.startsAt).toBe(new Date(draft.startsAt).toISOString());
  });

  it("maps API dates and nullable values back into local form values", () => {
    const localStart = "2026-10-13T12:00";
    const coupon: AdminCoupon = {
      id: "1",
      code: "SAVE10",
      name: "October offer",
      discountType: "PERCENTAGE",
      value: "10.00",
      minimumSubtotal: "1000.00",
      maximumDiscount: null,
      startsAt: new Date(localStart).toISOString(),
      endsAt: null,
      usageLimit: null,
      perCustomerLimit: 1,
      usedCount: 0,
      isActive: true,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
      deletedAt: null,
    };

    expect(couponToDraft(coupon)).toMatchObject({
      startsAt: localStart,
      endsAt: "",
      maximumDiscount: "",
      usageLimit: "",
      perCustomerLimit: "1",
    });
  });
});
