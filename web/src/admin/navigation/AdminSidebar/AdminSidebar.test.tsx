import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AdminSidebar } from "./AdminSidebar";
import { adminSidebarSections } from "./adminSidebar.config";
import { groupMatches, routeMatches } from "./adminSidebar.utils";

function renderSidebar(pathname: string, collapsed = false) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[pathname]}>
      <AdminSidebar collapsed={collapsed} onToggle={vi.fn()} />
    </MemoryRouter>,
  );
}

describe("AdminSidebar", () => {
  it("keeps navigation destinations in one reusable configuration", () => {
    const labels = adminSidebarSections.flatMap((section) =>
      section.items.map((item) => item.label),
    );

    expect(labels).toEqual([
      "Overview",
      "Products",
      "Categories",
      "Brands",
      "Product types",
      "Product attributes",
      "Orders",
      "Coupons",
    ]);
  });

  it("renders product tools and marks the current child route", () => {
    const html = renderSidebar("/admin/products/new");

    expect(html).toContain("Store admin");
    expect(html).toContain("All products");
    expect(html).toContain("Add product");
    expect(html).toContain("Collapse sidebar");
    expect(html).toContain('aria-current="page"');
  });

  it("renders categories and brands as top-level catalog tools", () => {
    const html = renderSidebar("/admin/categories");

    expect(html).toContain("Categories");
    expect(html).toContain("Brands");
    expect(html).not.toContain("All products");
    expect(html).toContain('aria-current="page"');
  });

  it("removes submenu content and provides icon labels when collapsed", () => {
    const html = renderSidebar("/admin/orders", true);

    expect(html).toContain("Expand sidebar");
    expect(html).toContain('aria-label="Orders"');
    expect(html).not.toContain("All products");
  });

  it("matches exact links and active child groups safely", () => {
    const overview = adminSidebarSections[0].items[0];
    const products = adminSidebarSections[1].items[0];

    expect(routeMatches("/admin", overview)).toBe(true);
    expect(routeMatches("/admin/orders", overview)).toBe(false);
    expect(groupMatches("/admin/products/new", products)).toBe(true);
    expect(groupMatches("/admin/orders", products)).toBe(false);
  });
});
