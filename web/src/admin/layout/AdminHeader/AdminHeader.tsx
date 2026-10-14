
import React from "react";
import { LayoutDashboard, LogOut } from "lucide-react"; // Icons: https://lucide.dev/icons
import { Link } from "react-router-dom";

import { useAuth } from "../../../features/auth/AuthContext"; // Provides logged-in user and logout function
import styles from "./AdminHeader.module.css"; // Change header styling in this CSS file

/**
 * AdminHeader — Top navigation bar for /admin routes.
 * Contains: Store logo, dashboard link, user information, and logout.
 * Product search has been moved to the Admin Products page.
 */
export const AdminHeader: React.FC = () => {
  // Get current user and logout handler from AuthContext.
  // To change authentication/logout behavior, check auth/AuthContext.tsx.
  const { user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.content}>

        {/* LOGO: Opens the public storefront (/).
            Change the text here; change appearance in styles.logo. */}
        <Link to="/" className={styles.logo} aria-label="Open DokanBD storefront">DokanBD</Link>

        {/* RIGHT ACTIONS: Layout and spacing controlled by styles.actions. */}
        <div className={styles.actions}>

          {/* DASHBOARD: Opens /admin. Change route, icon, or text here.
              btn and btn-ghost are global CSS classes. */}
          <Link to="/admin" className={`btn btn-ghost ${styles.dashboardLink}`}>
            <LayoutDashboard size={18} aria-hidden="true" /> <span>Admin Dashboard</span>
          </Link>

          {/* USER INFO: Only displayed when user exists.
              Values come from useAuth() -> user.
              Change appearance in styles.userInfo, userName, and roleBadge. */}
          {user && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.roleBadge}>{user.role.name}</span>
            </div>
          )}

          {/* LOGOUT BUTTON: Clicking triggers logout() from useAuth().
              Implementation: auth/AuthContext.tsx (or its referenced auth service).
              Change icon size here; change styling in global .btn-icon CSS. */}
          <button type="button" onClick={logout} className="btn-icon" title="Log out" aria-label="Log out"><LogOut size={20} /></button>

        </div>
      </div>
    </header>
  );
};
