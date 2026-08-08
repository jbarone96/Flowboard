import { Link, useNavigate } from "react-router-dom";
import { disconnectSocket } from "../socket";

export function Nav() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  function handleLogout() {
    disconnectSocket();
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">
        <img src="/favicon.svg" alt="" width="20" height="20" />
        Flowboard
      </Link>
      <div className="nav-links">
        {isLoggedIn ? (
          <>
            <Link to="/workspaces">Workspaces</Link>
            <button className="nav-button" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}