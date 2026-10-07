import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { LogOut } from "lucide-react";

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

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
