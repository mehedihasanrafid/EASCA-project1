import type { AdminSidebarSection as SidebarSectionDefinition } from "../../adminSidebar.types";
import styles from "../../AdminSidebar.module.css";
import { SidebarNavGroup } from "../SidebarNavGroup";
import { SidebarNavItem } from "../SidebarNavItem";

interface SidebarSectionProps {
  section: SidebarSectionDefinition;
  collapsed: boolean;
}

/** Renders one configured navigation section and chooses the correct item type. */
export function SidebarSection({ section, collapsed }: SidebarSectionProps) {
  return (
    <div className={styles.section}>
      {section.label && <span className={styles.sectionLabel}>{section.label}</span>}

      {section.items.map((item) => (
        item.children?.length
          ? <SidebarNavGroup key={item.to} item={item} collapsed={collapsed} />
          : <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
      ))}
    </div>
  );
}
