import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleLogin() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.login(email, password);
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
        <h2>Log in</h2>
        {error && <p className="error">{error}</p>}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button className="primary" onClick={handleLogin} disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </div>
    </div>
  );
}