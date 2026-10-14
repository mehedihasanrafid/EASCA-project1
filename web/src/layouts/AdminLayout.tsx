import React from "react";
import { Outlet } from "react-router-dom";

import {
  AdminSidebar,
  useAdminSidebarState,
} from "../admin/navigation/AdminSidebar";
import styles from "./AdminLayout.module.css";

export const AdminLayout: React.FC = () => {
  const { collapsed, toggle } = useAdminSidebarState();

  return (
    <div className={`${styles.shell}${collapsed ? ` ${styles.collapsed}` : ""}`}>
      <AdminSidebar collapsed={collapsed} onToggle={toggle} />
      <section className={styles.workspace}>
        <Outlet />
      </section>
    </div>
  );
};
