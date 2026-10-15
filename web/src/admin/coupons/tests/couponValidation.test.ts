import { describe, expect, it } from "vitest";

import type { CouponDraft } from "../types/coupon.types";
import { validateCouponDraft } from "../utils/couponValidation";

const validDraft: CouponDraft = {
  code: "SAVE10",
  name: "October offer",
  discountType: "PERCENTAGE",
  value: "10",
  minimumSubtotal: "1000",
  maximumDiscount: "500",
  startsAt: "2026-10-13T12:00",
  endsAt: "2026-10-31T23:59",
  usageLimit: "100",
  perCustomerLimit: "1",
  isActive: true,
};

describe("coupon form validation", () => {
  it("accepts valid browser-local start and end date values", () => {
    expect(validateCouponDraft(validDraft)).toBeNull();
  });

  it("accepts a coupon without an optional schedule", () => {
    expect(validateCouponDraft({ ...validDraft, startsAt: "", endsAt: "" })).toBeNull();
  });

  it("explains an invalid schedule instead of relying on browser validation", () => {
    expect(validateCouponDraft({
      ...validDraft,
      startsAt: "2026-10-31T12:00",
      endsAt: "2026-10-13T12:00",
    })).toBe("The end date and time must be after the start date and time.");
  });

  it("reports invalid numeric limits clearly", () => {
    expect(validateCouponDraft({ ...validDraft, perCustomerLimit: "1.5" }))
      .toBe("Per-customer limit must be a whole number from 1 to 100.");
  });
});
