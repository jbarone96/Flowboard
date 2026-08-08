import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "http://localhost:4000";

let socket: Socket | null = null;

/**
 * Returns a single shared Socket.io connection for the whole app session.
 * The connection is established once (lazily, on first call) and reused
 * across every page — pages join/leave specific workspace "rooms" as the
 * user navigates, rather than opening a new connection per page. This
 * mirrors how a real chat or collaboration app manages its socket: one
 * persistent connection, many logical subscriptions layered on top of it.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  const token = localStorage.getItem("token");

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

/**
 * Call this on logout, or when the token changes, so a stale/unauthenticated
 * connection doesn't linger and silently fail to receive events.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinWorkspace(workspaceId: string) {
  getSocket().emit("join-workspace", workspaceId);
}

export function leaveWorkspace(workspaceId: string) {
  getSocket().emit("leave-workspace", workspaceId);
}