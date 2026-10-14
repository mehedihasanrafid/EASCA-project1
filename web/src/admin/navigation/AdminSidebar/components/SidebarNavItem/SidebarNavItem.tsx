import { NavLink } from "react-router-dom";

import type { AdminSidebarItem } from "../../adminSidebar.types";
import styles from "../../AdminSidebar.module.css";

interface SidebarNavItemProps {
  item: AdminSidebarItem;
  collapsed: boolean;
}

/** A top-level destination that does not own a submenu. */
export function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.exact}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) => `${styles.link}${isActive ? ` ${styles.active}` : ""}`}
    >
      <Icon size={19} />
      <span className={styles.label}>{item.label}</span>
    </NavLink>
  );
}
