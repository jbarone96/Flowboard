import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

export function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"pending" | "error">("pending");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    // If the person isn't logged in, we can't accept the invite yet — they
    // need an account first. Redirect to signup, but remember where they
    // were headed so we can send them back here once they've signed up.
    if (!localStorage.getItem("token")) {
      navigate(`/signup?redirect=/invite/${token}`);
      return;
    }

    api
      .acceptInvite(token)
      .then((res) => navigate(`/board/${res.workspaceId}`))
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Something went wrong");
      });
  }, [token]);

  if (status === "error") {
    return (
      <div className="container">
        <div className="card">
          <h2>Invite link not valid</h2>
          <p className="error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <p>Joining workspace...</p>
      </div>
    </div>
  );
}