import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { BestSellers } from "./components/BestSellers";
import { DashboardSummary } from "./components/DashboardSummary";
import { LowStockProducts } from "./components/LowStockProducts";
import { SalesTrendChart } from "./components/SalesTrendChart";

describe("admin dashboard components", () => {
  it("renders the four store summary metrics", () => {
    const html = renderToStaticMarkup(
      <DashboardSummary
        summary={{ totalSales: "2500.00", totalOrders: 8, todayOrders: 2, lowStockCount: 3, currency: "BDT" }}
      />,
    );

    expect(html).toContain("Total sales");
    expect(html).toContain("Total orders");
    expect(html).toContain("Today&#x27;s orders");
    expect(html).toContain("Low stock");
  });

  it("links actionable best sellers and low-stock products to their editors", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BestSellers products={[{ productId: "12", productName: "Shirt", quantitySold: 5, sales: "2500.00" }]} />
        <LowStockProducts products={[{
          productId: "12",
          productName: "Shirt",
          variantId: "30",
          variantName: "Black / XL",
          sku: "SHIRT-BLK-XL",
          stockQuantity: 2,
          lowStockLevel: 5,
        }]} />
      </MemoryRouter>,
    );

    expect(html).toContain("/admin/products/12/edit");
    expect(html).toContain("SHIRT-BLK-XL");
    expect(html).toContain("Restock");
  });

  it("renders an accessible sales chart and its empty state", () => {
    const html = renderToStaticMarkup(
      <SalesTrendChart data={[{ date: "2026-10-13", sales: "0.00", orderCount: 0 }]} />,
    );

    expect(html).toContain("Daily sales for the last 30 days");
    expect(html).toContain("No recognized sales in this period yet.");
  });
});
