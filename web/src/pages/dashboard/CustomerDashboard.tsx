import React from "react";
import { CheckCircle, ClipboardList, MapPin, ShoppingCart } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const registrationState = location.state as
    | { registrationComplete?: boolean; verificationEmailSent?: boolean }
    | null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Account</h1>
        <p>Welcome back, {user?.name}</p>
      </div>
      {registrationState?.registrationComplete && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>
            Your account is ready and you are signed in.
            {registrationState.verificationEmailSent
              ? " Check your email to verify your address."
              : ""}
          </span>
        </div>
      )}
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>Profile Information</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Phone:</strong> {user?.phone}</p>
          <p><strong>Email:</strong> {user?.email || "Not provided"}</p>
          <p><strong>Role:</strong> {user?.role.name}</p>
          <p><strong>Member since:</strong> {new Date(user?.createdAt || "").toLocaleDateString()}</p>
        </div>
        <div className="account-action-grid">
          <Link to="/account/addresses" className="account-action-card">
            <MapPin size={26} />
            <div><strong>Delivery addresses</strong><span>Add or update saved addresses</span></div>
          </Link>
          <Link to="/cart" className="account-action-card">
            <ShoppingCart size={26} />
            <div><strong>Shopping cart</strong><span>Review products and checkout</span></div>
          </Link>
          <Link to="/account/orders" className="account-action-card">
            <ClipboardList size={26} />
            <div><strong>My orders</strong><span>Track deliveries and view history</span></div>
          </Link>
        </div>
      </div>
    </div>
  );
};
