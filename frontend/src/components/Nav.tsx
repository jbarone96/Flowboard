import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "../auth";
import { useIsLoggedIn } from "../hooks/useIsLoggedIn";
import { disconnectSocket } from "../socket";

export function Nav() {
  const navigate = useNavigate();
  const isLoggedIn = useIsLoggedIn();

  function handleLogout() {
    disconnectSocket();
    clearToken();
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