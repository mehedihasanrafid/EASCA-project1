import React, { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { authApi } from "../../api/auth";
import { ApiException } from "../../api/client";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not request a password reset. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card auth-status">
          <CheckCircle className="auth-status-icon" size={64} />
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            If an active DokanBD account uses that address, we sent a password-reset link.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Forgot your password?</h1>
        <p className="auth-subtitle">Enter your account email and we will send a reset link.</p>

        {error && <div className="alert alert-error"><AlertCircle size={18} /><span>{error}</span></div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email">Email address</label>
            <input
              id="forgot-email"
              className="form-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>

        <p className="auth-footer"><Link to="/login" className="text-link">Back to login</Link></p>
      </div>
    </div>
  );
};
