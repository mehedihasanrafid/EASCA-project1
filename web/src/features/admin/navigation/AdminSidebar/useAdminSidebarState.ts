import { useState } from "react";

const SIDEBAR_STORAGE_KEY = "dokanbd.admin.sidebar.collapsed";

/**
 * Owns the user's expanded/collapsed preference.
 * The lazy initializer reads local storage only once when the layout mounts.
 */
export function useAdminSidebarState() {
  const [collapsed, setCollapsed] = useState(() => (
    typeof window !== "undefined"
      && window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
  ));

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  return { collapsed, toggle };
}
