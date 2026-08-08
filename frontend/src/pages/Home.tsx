import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="container">
      <div className="card" style={{ textAlign: "center" }}>
        <h1>Flowboard</h1>
        <p style={{ marginBottom: 24 }}>
          A shared issue tracker, built for teams — with real-time updates and
          proper workspace isolation.
        </p>
        <Link to="/signup">
          <button className="primary">Get started</button>
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