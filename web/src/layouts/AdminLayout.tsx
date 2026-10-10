import React from "react";
import {
  Boxes,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Package,
  Shapes,
  Tags,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

interface AdminNavigationItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  end?: boolean;
}

const navigation: AdminNavigationItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/brands", label: "Brands", icon: Tags },
  { to: "/admin/product-types", label: "Product types", icon: Boxes },
  { to: "/admin/properties", label: "Properties", icon: Shapes },
];

export const AdminLayout: React.FC = () => (
  <div className="admin-shell">
    <aside className="admin-sidebar" aria-label="Admin navigation">
      <div className="admin-sidebar-heading">
        <span>Workspace</span>
        <strong>Store admin</strong>
      </div>
      <nav className="admin-navigation">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `admin-navigation-link${isActive ? " is-active" : ""}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
    <section className="admin-workspace">
      <Outlet />
    </section>
  </div>
);
