import React from "react";
import { useAuth } from "../../features/auth/AuthContext";

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Account</h1>
        <p>Welcome back, {user?.name}</p>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>Profile Information</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Phone:</strong> {user?.phone}</p>
          <p><strong>Email:</strong> {user?.email || "Not provided"}</p>
          <p><strong>Role:</strong> {user?.role.name}</p>
          <p><strong>Member since:</strong> {new Date(user?.createdAt || "").toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};
