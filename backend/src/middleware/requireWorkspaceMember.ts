import { NextFunction, Response } from "express";
import { prisma } from "../db";
import { AppError } from "./errorHandler";
import { AuthedRequest } from "./requireAuth";

export interface WorkspaceScopedRequest extends AuthedRequest {
  workspaceId?: string;
  workspaceRole?: "ADMIN" | "MEMBER";
}

/**
 * The core tenant-isolation gate. Every route that touches workspace data
 * (issues, members, settings) sits behind this middleware. It expects
 * requireAuth to have already run (so req.userId is set), reads the
 * workspaceId from the route params, and verifies a WorkspaceMember row
 * actually exists linking this user to this workspace.
 *
 * This is the REST equivalent of SlotSync's unique-constraint-at-the-DB
 * story, but the mechanism is different: there's no single database
 * constraint that can enforce "only members can see this workspace's
 * issues" the way a unique index prevented double-booking. Isolation here
 * is enforced procedurally, at the application layer, on every request —
 * which is why this check exists as middleware applied consistently,
 * rather than being left to each route handler to remember individually.
 */
export async function requireWorkspaceMember(
  req: WorkspaceScopedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const workspaceId = req.params.workspaceId;
    if (!workspaceId) throw new AppError("Missing workspace id", 400);

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: req.userId!,
        },
      },
    });

    if (!membership) {
      // Deliberately the same 404 a nonexistent workspace would return,
      // not a 403. Returning 403 confirms the workspace exists to someone
      // who isn't a member of it; 404 reveals nothing.
      throw new AppError("Workspace not found", 404);
    }

    req.workspaceId = workspaceId;
    req.workspaceRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Stacks on top of requireWorkspaceMember for admin-only actions
 * (managing members, deleting the workspace, etc). Must run after it.
 */
export function requireWorkspaceAdmin(req: WorkspaceScopedRequest, res: Response, next: NextFunction) {
  if (req.workspaceRole !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }
  next();
}