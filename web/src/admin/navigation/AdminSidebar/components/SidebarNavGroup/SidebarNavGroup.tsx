import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import type { AdminSidebarItem } from "../../adminSidebar.types";
import { groupMatches } from "../../adminSidebar.utils";
import styles from "../../AdminSidebar.module.css";

interface SidebarNavGroupProps {
  item: AdminSidebarItem;
  collapsed: boolean;
}

/** A navigation destination with expandable child tools, such as Products. */
export function SidebarNavGroup({ item, collapsed }: SidebarNavGroupProps) {
  const { pathname } = useLocation();
  const active = groupMatches(pathname, item);
  const [open, setOpen] = useState(active);
  const Icon = item.icon;

  // Keep the relevant submenu visible after navigation to one of its children.
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  return (
    <div className={styles.group}>
      <div className={styles.parentRow}>
        <NavLink
          to={item.to}
          title={collapsed ? item.label : undefined}
          aria-label={collapsed ? item.label : undefined}
          className={`${styles.link}${active ? ` ${styles.active}` : ""}`}
        >
          <Icon size={19} />
          <span className={styles.label}>{item.label}</span>
        </NavLink>

        {!collapsed && (
          <button
            type="button"
            className={styles.submenuToggle}
            onClick={() => setOpen((current) => !current)}
            aria-label={`${open ? "Close" : "Open"} ${item.label} menu`}
            aria-expanded={open}
          >
            <ChevronDown size={16} className={open ? styles.openChevron : undefined} />
          </button>
        )}
      </div>

      {!collapsed && open && item.children && (
        <div className={styles.children}>
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                end={child.exact}
                className={({ isActive }) => isActive ? styles.activeChild : undefined}
              >
                <ChildIcon size={14} />
                <span>{child.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
