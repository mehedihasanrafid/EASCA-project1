import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { ApiException } from "../../api/client";
import { AlertCircle, CheckCircle } from "lucide-react";

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    const data: Record<string, string> = { name, phone, password };
    if (email.trim() !== "") {
      data.email = email.trim();
    }

    try {
      await register(data);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
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

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: '#157347', marginBottom: '1rem' }}>
            <CheckCircle size={64} />
          </div>
          <h1 className="auth-title">Registration Successful!</h1>
          <p className="auth-subtitle" style={{ marginBottom: 0 }}>
            Welcome to DokanBD. Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

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
