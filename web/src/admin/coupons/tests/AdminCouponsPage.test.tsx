import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminCouponsPage } from "../AdminCouponsPage";

describe("AdminCouponsPage", () => {
  it("composes the coupon header, form, and library", () => {
    const html = renderToStaticMarkup(<AdminCouponsPage />);

    expect(html).toContain("Marketing");
    expect(html).toContain("Create coupon");
    expect(html).toContain("Coupon library");
    expect(html).toContain("Loading coupons...");
  });
});
