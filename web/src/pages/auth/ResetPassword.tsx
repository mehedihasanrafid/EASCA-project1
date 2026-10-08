import React, { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { authApi } from "../../api/auth";
import { ApiException } from "../../api/client";

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (token.length !== 64) {
      setError("This password-reset link is incomplete or invalid.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setComplete(true);
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not reset the password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (complete) {
    return (
      <div className="auth-container">
        <div className="auth-card auth-status">
          <CheckCircle className="auth-status-icon" size={64} />
          <h1 className="auth-title">Password updated</h1>
          <p className="auth-subtitle">Your old sessions were signed out. Log in with your new password.</p>
          <Link to="/login" className="btn btn-primary btn-full">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create a new password</h1>
        <p className="auth-subtitle">Use between 8 and 72 characters.</p>

        {error && <div className="alert alert-error"><AlertCircle size={18} /><span>{error}</span></div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              className="form-input"
              type="password"
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              className="form-input"
              type="password"
              minLength={8}
              maxLength={72}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading || token.length !== 64}>
            {loading ? "Updating password..." : "Update password"}
          </button>
        </form>

        <p className="auth-footer"><Link to="/forgot-password" className="text-link">Request another link</Link></p>
      </div>
    </div>
  );
};
