import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { MainLayout } from "../layouts/MainLayout";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { CustomerDashboard } from "../pages/dashboard/CustomerDashboard";
import { AdminDashboard } from "../pages/dashboard/AdminDashboard";
import { Home } from "../pages/Home";
import { ProductDetail } from "../pages/products/ProductDetail";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

const RoleRoute: React.FC<{ roles: string[] }> = ({ roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (!roles.includes(user.role.code)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

const PublicOnlyRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  
  if (user) {
    if (user.role.code === "ADMIN" || user.role.code === "OWNER") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
};

const Forbidden: React.FC = () => (
  <div className="app-shell">
    <div className="welcome-card">
      <h1 style={{ color: "#d93025" }}>Access Denied</h1>
      <p>You don't have permission to view this page.</p>
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Home Page accessible to everyone */}
          <Route path="/" element={<Home />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          
          {/* Auth routes (Logged out only) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<CustomerDashboard />} />
            <Route path="/forbidden" element={<Forbidden />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<RoleRoute roles={["ADMIN", "OWNER"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
