import React from "react";
import { Outlet, useLocation } from "react-router-dom";

import { AdminHeader } from "../admin/layout/AdminHeader/AdminHeader";
import { StorefrontHeader } from "../features/storefront/StorefrontHeader";
import { StorefrontSecondaryBar } from "../features/storefront/StorefrontSecondaryBar";

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname === "/admin" || location.pathname.startsWith("/admin/");

  return (
    <div className="layout">
      {isAdminRoute ? (
        <AdminHeader />
      ) : (
        <>
          <StorefrontHeader />
          {/* Future extension point for promotions, categories, and brands. */}
          <StorefrontSecondaryBar />
        </>
      )}
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
