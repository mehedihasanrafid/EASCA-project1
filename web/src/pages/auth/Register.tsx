import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { RegisterInput } from "../../api/auth";
import { useAuth } from "../../features/auth/AuthContext";
import { ApiException } from "../../api/client";
import { AlertCircle } from "lucide-react";

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    const data: RegisterInput = { name, phone, password };
    if (email.trim() !== "") {
      data.email = email.trim();
    }

    try {
      await register(data);
      navigate("/account", {
        replace: true,
        state: {
          registrationComplete: true,
          verificationEmailSent: Boolean(data.email),
        },
      });
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.error.code === "VALIDATION_ERROR" && err.error.details) {
          setFieldErrors(err.error.details);
        } else {
          setError(err.error.message);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create an Account</h1>
        <p className="auth-subtitle">Join DokanBD to start shopping</p>
        
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              className={`form-input ${fieldErrors.name ? "input-error" : ""}`}
            />
            {fieldErrors.name && <span className="error-text">{fieldErrors.name[0]}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01700000000"
              required
              className={`form-input ${fieldErrors.phone ? "input-error" : ""}`}
            />
            {fieldErrors.phone && <span className="error-text">{fieldErrors.phone[0]}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email (Optional)</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className={`form-input ${fieldErrors.email ? "input-error" : ""}`}
            />
            {fieldErrors.email && <span className="error-text">{fieldErrors.email[0]}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`form-input ${fieldErrors.password ? "input-error" : ""}`}
            />
            {fieldErrors.password && <span className="error-text">{fieldErrors.password[0]}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login" className="text-link">Log in</Link>
        </p>
      </div>
    </div>
  );
};
