import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OrderStatusHistory } from "../../../api/orders";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { OrderTotals } from "./OrderTotals";

const history: OrderStatusHistory[] = [
  {
    id: "1",
    oldStatus: null,
    newStatus: "PENDING",
    createdAt: "2026-10-08T07:03:00.000Z",
    note: "Order placed by customer.",
  },
  {
    id: "2",
    oldStatus: "PENDING",
    newStatus: "CONFIRMED",
    createdAt: "2026-10-08T07:41:00.000Z",
    note: "Stock checked.",
  },
];

describe("shared order components", () => {
  it("renders a semantic status badge using the shared design token classes", () => {
    const html = renderToStaticMarkup(<OrderStatusBadge status="SHIPPED" />);

    expect(html).toContain("SHIPPED");
    expect(html).toContain("bg-accent-soft");
    expect(html).toContain("text-accent");
  });

  it("renders the complete fulfilment timeline and optional administrator notes", () => {
    const html = renderToStaticMarkup(
      <OrderStatusTimeline status="CONFIRMED" history={history} showNotes />,
    );

    expect(html).toContain("Order placed");
    expect(html).toContain("Confirmed");
    expect(html).toContain("Shipped");
    expect(html).toContain("Delivered");
    expect(html).toContain("Stock checked.");
  });

  it("renders shared BDT totals for customer and administrator pages", () => {
    const html = renderToStaticMarkup(
      <OrderTotals
        subtotal="1999.00"
        productDiscountTotal="201.00"
        couponDiscountTotal="100.00"
        couponCode="SAVE100"
        deliveryCharge="60.00"
        grandTotal="1959.00"
        paymentStatus="PENDING"
      />,
    );

    expect(html).toContain("Discounted subtotal");
    expect(html).toContain("Product savings");
    expect(html).toContain("Coupon (SAVE100)");
    expect(html).toContain("COD total");
    expect(html).toContain("1,959");
    expect(html).toContain("Payment status");
  });
});
