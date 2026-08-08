import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";

export function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nameValid = name.trim().length > 0;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;
  const formValid = nameValid && emailValid && passwordValid;

  async function handleSignup() {
    setTouched(true);
    if (!formValid) return;

    setError(null);
    setSubmitting(true);
    try {
      const res = await api.signup(name, email, password);
      localStorage.setItem("token", res.token);
      const redirect = searchParams.get("redirect");
      navigate(redirect ?? "/workspaces");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Create your account</h2>
        {error && <p className="error">{error}</p>}

        <div className="field">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          {touched && !nameValid && <div className="tooltip">Enter your name.</div>}
        </div>

        <div className="field">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          {touched && !emailValid && <div className="tooltip">Enter a valid email address.</div>}
        </div>

        <div className="field">
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {touched && !passwordValid && (
            <div className="tooltip">Password needs at least 8 characters.</div>
          )}
        </div>

        <button className="primary" onClick={handleSignup} disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </div>
    </div>
  );
}