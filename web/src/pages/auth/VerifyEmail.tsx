import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { authApi } from "../../api/auth";
import { ApiException } from "../../api/client";
import { useAuth } from "../../features/auth/AuthContext";

type VerificationState = "loading" | "success" | "error";

export const VerifyEmail: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const started = useRef(false);
  const [status, setStatus] = useState<VerificationState>("loading");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (token.length !== 64) {
      setError("This verification link is incomplete or invalid.");
      setStatus("error");
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((requestError) => {
        setError(
          requestError instanceof ApiException
            ? requestError.error.message
            : "Could not verify this email. The link may have expired.",
        );
        setStatus("error");
      });
  }, [token]);

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault();
    setResending(true);
    setResent(false);

    try {
      await authApi.resendVerification(email.trim());
      setResent(true);
    } catch (requestError) {
      setError(
        requestError instanceof ApiException
          ? requestError.error.message
          : "Could not request another verification email.",
      );
    } finally {
      setResending(false);
    }
  };

  if (status === "loading") {
    return <div className="loading-screen">Verifying your email...</div>;
  }

  if (status === "success") {
    return (
      <div className="auth-container">
        <div className="auth-card auth-status">
          <CheckCircle className="auth-status-icon" size={64} />
          <h1 className="auth-title">Email verified</h1>
          <p className="auth-subtitle">Your DokanBD email address is now verified.</p>
          <Link to={user ? "/account" : "/login"} className="btn btn-primary btn-full">
            {user ? "Go to my account" : "Log in"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card auth-status">
        <AlertCircle className="auth-status-icon" size={64} />
        <h1 className="auth-title">Verification unsuccessful</h1>
        <p className="auth-subtitle">{error}</p>

        <div className="auth-secondary-form">
          {resent && (
            <div className="alert alert-success">
              <CheckCircle size={18} />
              <span>If the account needs verification, a new email has been sent.</span>
            </div>
          )}
          <form className="auth-form" onSubmit={handleResend}>
            <div className="form-group">
              <label htmlFor="verification-email">Email address</label>
              <input
                id="verification-email"
                className="form-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={resending}>
              {resending ? "Sending..." : "Send another verification email"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
