import { describe, expect, it } from "vitest";
import { createCouponSchema } from "./coupon.schema.js";

describe("coupon schema", () => {
  it("normalizes valid coupon codes", () => {
    expect(createCouponSchema.parse({ code: " save-10 ", name: "Welcome", discountType: "PERCENTAGE", value: 10 }).code).toBe("SAVE-10");
  });

  it("rejects percentage values above 100 and invalid date ranges", () => {
    expect(createCouponSchema.safeParse({ code: "BAD101", name: "Bad", discountType: "PERCENTAGE", value: 101 }).success).toBe(false);
    expect(createCouponSchema.safeParse({
      code: "DATES", name: "Dates", discountType: "FIXED", value: 100,
      startsAt: "2026-10-20T00:00:00.000Z", endsAt: "2026-10-10T00:00:00.000Z",
    }).success).toBe(false);
  });
});
