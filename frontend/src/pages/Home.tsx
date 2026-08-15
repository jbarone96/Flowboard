import { Link } from "react-router-dom";
import { useIsLoggedIn } from "../hooks/useIsLoggedIn";

export function Home() {
  const isLoggedIn = useIsLoggedIn();

  return (
    <div className="container">
      <div className="card" style={{ textAlign: "center" }}>
        <h1>Flowboard</h1>
        <p style={{ marginBottom: 24 }}>
          A shared issue tracker, built for teams — with real-time updates and
          proper workspace isolation.
        </p>
        <Link to={isLoggedIn ? "/workspaces" : "/signup"}>
          <button className="primary">{isLoggedIn ? "Go to your workspaces" : "Get started"}</button>
        </Link>
      </div>

      <div className="card">
        <h3>How it works</h3>
        <p>
          Create a workspace, invite your team, and track issues on a shared
          board. Changes sync live — no refresh needed.
        </p>
      </div>
    </div>
  );
}