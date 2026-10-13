import {
  Boxes,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Package,
  Shapes,
  Tags,
  TicketPercent,
} from "lucide-react";

import type { AdminSidebarSection } from "./adminSidebar.types";

/**
 * Single source of truth for admin navigation.
 * Add or reorder sidebar links here, then register the same route in AppRouter.
 */
export const adminSidebarSections: AdminSidebarSection[] = [
  {
    id: "overview",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      {
        to: "/admin/products",
        label: "Products",
        icon: Package,
        children: [
          { to: "/admin/products", label: "All products", icon: Package, exact: true },
          { to: "/admin/products/new", label: "Add product", icon: Package },
          { to: "/admin/categories", label: "Categories", icon: FolderTree },
          { to: "/admin/brands", label: "Brands", icon: Tags },
        ],
      },
      { to: "/admin/product-types", label: "Product types", icon: Boxes },
      { to: "/admin/properties", label: "Properties", icon: Shapes },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ClipboardList },
      { to: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    ],
  },
];
