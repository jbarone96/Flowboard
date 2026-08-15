const AUTH_EVENT = "flowboard-auth-change";

/**
 * localStorage changes don't trigger a re-render on their own, and React
 * Router doesn't remount a page when navigating to the route it's already
 * on (e.g. clicking "Log out" while already viewing "/"). This tiny event
 * bus lets any component react to login/logout immediately, regardless of
 * whether a route change happens to also cause a remount.
 */
export function setToken(token: string) {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearToken() {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export { AUTH_EVENT };