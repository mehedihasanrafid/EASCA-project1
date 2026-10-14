import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import styles from "./AdminSidebar.module.css";
import { adminSidebarSections } from "./adminSidebar.config";
import { SidebarSection } from "./components/SidebarSection";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Administrator navigation shell.
 * Configuration and item rendering live in separate files to keep this
 * component focused on layout and accessibility.
 */
export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  return (
    <aside
      className={`${styles.sidebar}${collapsed ? ` ${styles.collapsed}` : ""}`}
      aria-label="Admin navigation"
    >
      <header className={styles.header}>
        <div className={styles.headingCopy}>
          <span>Workspace</span>
          <strong>Store admin</strong>
        </div>

        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>
      </header>

      <nav className={styles.navigation}>
        {adminSidebarSections.map((section) => (
          <SidebarSection key={section.id} section={section} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}
