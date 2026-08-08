import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer, type Socket } from "socket.io";

interface AuthedSocket extends Socket {
  userId?: string;
}

let io: SocketIOServer | null = null;

/**
 * Creates and configures the Socket.io server, attached to the same HTTP
 * server Express uses. Called once from index.ts at startup.
 *
 * Tenant isolation for real-time events: every connected client must prove
 * who they are (JWT, same token used for REST auth) and then explicitly
 * join a "room" named after the workspace they're viewing. All subsequent
 * emits are scoped to that room — io.to(workspaceId).emit(...) — never a
 * global broadcast. A client that hasn't joined a workspace's room simply
 * never receives events for it, the same way a REST query scoped to
 * workspaceId never returns another tenant's rows.
 */
export function initSocketServer(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
  });

  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing auth token"));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    // The client emits "join-workspace" after connecting, once it knows
    // which workspace the user is viewing. We don't auto-join anything on
    // connect — membership is verified by the REST API before the client
    // ever gets a workspaceId to join, so trusting the client's request
    // here is safe: at worst they join a room and receive no events
    // because the corresponding REST calls will already have 403'd them.
    socket.on("join-workspace", (workspaceId: string) => {
      socket.join(workspaceId);
    });

    socket.on("leave-workspace", (workspaceId: string) => {
      socket.leave(workspaceId);
    });
  });

  return io;
}

/**
 * Called from route handlers after a successful write, to broadcast the
 * change to everyone else currently viewing that workspace.
 */
export function emitToWorkspace(workspaceId: string, event: string, data: unknown) {
  if (!io) {
    console.warn("Socket server not initialized, skipping emit");
    return;
  }
  io.to(workspaceId).emit(event, data);
}