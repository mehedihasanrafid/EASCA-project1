import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CouponForm } from "../components/CouponForm/CouponForm";
import type { CouponDraft } from "../types/coupon.types";

const draft: CouponDraft = {
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

describe("CouponForm", () => {
  it("uses explicit validation and browser-local schedule fields", () => {
    const html = renderToStaticMarkup(
      <CouponForm
        draft={draft}
        editing={false}
        saving={false}
        onChange={() => undefined}
        onReset={() => undefined}
        onSubmit={(event) => event.preventDefault()}
      />,
    );

    expect(html).toContain("noValidate");
    expect(html.match(/type="datetime-local"/g)).toHaveLength(2);
    expect(html.match(/step="60"/g)).toHaveLength(2);
    expect(html).toContain("Create coupon");
  });

  it("shows edit actions when a coupon is selected", () => {
    const html = renderToStaticMarkup(
      <CouponForm
        draft={draft}
        editing
        saving={false}
        onChange={() => undefined}
        onReset={() => undefined}
        onSubmit={(event) => event.preventDefault()}
      />,
    );

    expect(html).toContain("Update coupon");
    expect(html).toContain("Cancel");
  });
});
