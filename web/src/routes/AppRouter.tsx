import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { MainLayout } from "../layouts/MainLayout";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { VerifyEmail } from "../pages/auth/VerifyEmail";
import { CustomerDashboard } from "../pages/dashboard/CustomerDashboard";
import { Home } from "../pages/Home";
import { ProductDetail } from "../pages/products/ProductDetail";
import { SearchResultsPage } from "../pages/products/SearchResultsPage";
import { CartPage } from "../pages/cart/CartPage";
import { AddressesPage } from "../pages/account/AddressesPage";
import { CheckoutPage } from "../pages/checkout/CheckoutPage";
import { OrdersPage } from "../pages/orders/OrdersPage";
import { OrderDetailPage } from "../pages/orders/OrderDetailPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminOrderDetailPage } from "../pages/admin/AdminOrderDetailPage";
import { AdminLayout } from "../layouts/AdminLayout";
import { AdminBrandsPage } from "../pages/admin/AdminBrandsPage";
import { AdminCategoriesPage } from "../pages/admin/AdminCategoriesPage";
import { AdminDashboardPage } from "../admin/dashboard";
import { AdminProductEditorPage } from "../admin/product-editor";
import { AdminProductsPage } from "../admin/products";
import { AdminProductTypesPage } from "../pages/admin/AdminProductTypesPage";
import { AdminAttributesPage } from "../admin/attributes";
import { AdminCouponsPage } from "../pages/admin/AdminCouponsPage";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

const AccountRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role.code === "ADMIN" || user.role.code === "OWNER") {
    return <Navigate to="/admin" replace />;
  }

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
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Auth routes (Logged out only) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Customer account route; administrators return to their dashboard. */}
          <Route element={<AccountRoute />}>
            <Route path="/account" element={<CustomerDashboard />} />
            <Route path="/account/addresses" element={<AddressesPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account/orders" element={<OrdersPage />} />
            <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/forbidden" element={<Forbidden />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<RoleRoute roles={["ADMIN", "OWNER"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/new" element={<AdminProductEditorPage />} />
              <Route path="products/:productId/edit" element={<AdminProductEditorPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="brands" element={<AdminBrandsPage />} />
              <Route path="product-types" element={<AdminProductTypesPage />} />
              <Route path="attributes" element={<AdminAttributesPage />} />
              <Route path="properties" element={<Navigate to="/admin/attributes" replace />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="catalog" element={<Navigate to="/admin/categories" replace />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
