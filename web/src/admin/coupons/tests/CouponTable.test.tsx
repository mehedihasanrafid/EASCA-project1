import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CouponTable } from "../components/CouponTable/CouponTable";
import type { AdminCoupon } from "../types/coupon.types";

const coupon: AdminCoupon = {
  id: "1",
  code: "SAVE10",
  name: "Ten percent off",
  discountType: "PERCENTAGE",
  value: "10",
  minimumSubtotal: "1000",
  maximumDiscount: "500",
  startsAt: null,
  endsAt: null,
  usageLimit: 100,
  perCustomerLimit: 1,
  usedCount: 12,
  isActive: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  deletedAt: null,
};

const callbacks = {
  onArchive: async () => undefined,
  onCreate: () => undefined,
  onEdit: () => undefined,
  onRestore: async () => undefined,
};

describe("CouponTable", () => {
  it("renders formatted coupon details and actions", () => {
    const html = renderToStaticMarkup(
      <CouponTable coupons={[coupon]} loading={false} {...callbacks} />,
    );

    expect(html).toContain("SAVE10");
    expect(html).toContain("10% off");
    expect(html).toContain("12 / 100");
    expect(html).toContain("Active");
    expect(html).toContain('aria-label="Edit SAVE10"');
    expect(html).toContain('aria-label="Archive SAVE10"');
  });

  it("renders the empty state without a table", () => {
    const html = renderToStaticMarkup(
      <CouponTable coupons={[]} loading={false} {...callbacks} />,
    );

    expect(html).toContain("No coupons yet");
    expect(html).toContain("Create one");
    expect(html).not.toContain("<table");
  });
});
