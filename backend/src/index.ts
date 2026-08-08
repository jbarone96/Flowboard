import cors from "cors";
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { errorHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/requireAuth";
import { requireWorkspaceMember } from "./middleware/requireWorkspaceMember";
import { authRouter } from "./routes/auth";
import { issuesRouter } from "./routes/issues";
import { workspacesRouter } from "./routes/workspaces";
import { initSocketServer } from "./socket";

const app = express();

// Socket.io needs a raw http.Server to attach to — Express's app.listen()
// normally creates one implicitly, but we need a reference to it up front
// so both Express and Socket.io can share the same underlying server and
// port, rather than running two separate servers.
const httpServer = createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/workspaces", requireAuth, workspacesRouter);

// Issue routes are nested under a specific workspace and need that
// workspace's membership verified before any issue-specific logic runs —
// requireWorkspaceMember reads :workspaceId from this mount path.

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

initSocketServer(httpServer);

const port = process.env.PORT ?? 4000;
httpServer.listen(port, () => console.log(`API + WebSocket server listening on http://localhost:${port}`));