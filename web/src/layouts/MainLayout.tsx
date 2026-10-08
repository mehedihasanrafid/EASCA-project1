import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useCart } from "../features/cart/CartContext";
import { LayoutDashboard, LogOut, ShoppingCart, UserRound } from "lucide-react";

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const isAdmin = user?.role.code === "ADMIN" || user?.role.code === "OWNER";
  const cartQuantity = cart?.totals.totalQuantity ?? 0;

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            DokanBD
          </Link>
          
          <div className="header-actions">
            {user ? (
              <div className="user-menu">
                {!isAdmin && (
                  <Link to="/cart" className="btn btn-ghost header-cart-link" aria-label={`Cart with ${cartQuantity} item${cartQuantity === 1 ? "" : "s"}`}>
                    <ShoppingCart size={20} />
                    <span className="header-action-label">Cart</span>
                    {cartQuantity > 0 && (
                      <span className="header-cart-badge">{cartQuantity}</span>
                    )}
                  </Link>
                )}
                <Link
                  to={isAdmin ? "/admin" : "/account"}
                  className="btn btn-ghost dashboard-link"
                >
                  {isAdmin ? <LayoutDashboard size={18} /> : <UserRound size={18} />}
                  <span>{isAdmin ? "Admin Dashboard" : "My Account"}</span>
                </Link>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="role-badge">{user.role.name}</span>
                </div>
                <button onClick={logout} className="btn-icon" title="Log out">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="btn btn-ghost">Log In</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
