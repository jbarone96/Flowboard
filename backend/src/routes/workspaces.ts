import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { AppError } from "../middleware/errorHandler";
import { AuthedRequest, requireAuth } from "../middleware/requireAuth";
import {
  requireWorkspaceAdmin,
  requireWorkspaceMember,
  WorkspaceScopedRequest,
} from "../middleware/requireWorkspaceMember";
import { issuesRouter } from "./issues";

export const workspacesRouter = Router();

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

// Create a workspace. The creator is automatically added as ADMIN — this
// happens inside a transaction so we never end up with a workspace that
// has no members (which would make it permanently inaccessible).
workspacesRouter.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { name } = createWorkspaceSchema.parse(req.body);
    const slug = slugify(name);

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({ data: { name, slug } });
      await tx.workspaceMember.create({
        data: { workspaceId: ws.id, userId: req.userId!, role: "ADMIN" },
      });
      return ws;
    });

    res.status(201).json({ workspace });
  } catch (err) {
    next(err);
  }
});

// List every workspace the current user belongs to.
workspacesRouter.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.userId },
      include: { workspace: true },
    });
    res.json({ workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role })) });
  } catch (err) {
    next(err);
  }
});

// Workspace detail — requireWorkspaceMember already verified access.
workspacesRouter.get(
  "/:workspaceId",
  requireAuth,
  requireWorkspaceMember,
  async (req: WorkspaceScopedRequest, res, next) => {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspaceId },
      });
      res.json({ workspace, role: req.workspaceRole });
    } catch (err) {
      next(err);
    }
  }
);

// List members of a workspace.
workspacesRouter.get(
  "/:workspaceId/members",
  requireAuth,
  requireWorkspaceMember,
  async (req: WorkspaceScopedRequest, res, next) => {
    try {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: req.workspaceId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      res.json({ members });
    } catch (err) {
      next(err);
    }
  }
);

const inviteSchema = z.object({
  email: z.email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

// Admin-only: create an invite. No email actually sent for the MVP — the
// invite link itself (containing the token) is what gets shared manually.
workspacesRouter.post(
  "/:workspaceId/invites",
  requireAuth,
  requireWorkspaceMember,
  requireWorkspaceAdmin,
  async (req: WorkspaceScopedRequest, res, next) => {
    try {
      const { email, role } = inviteSchema.parse(req.body);

      const invite = await prisma.invite.create({
        data: {
          workspaceId: req.workspaceId!,
          email,
          role,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.status(201).json({ invite, inviteLink: `/invite/${invite.token}` });
    } catch (err) {
      next(err);
    }
  }
);

// Accept an invite. Requires auth (the person must have an account/be
// logged in) but deliberately does NOT require existing membership — that
// would be circular, since accepting the invite is what grants membership.
workspacesRouter.post("/invites/:token/accept", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const invite = await prisma.invite.findUnique({ where: { token: req.params.token } });

    if (!invite) throw new AppError("Invite not found", 404);
    if (invite.acceptedAt) throw new AppError("This invite has already been used", 409);
    if (invite.expiresAt < new Date()) throw new AppError("This invite has expired", 410);

    await prisma.$transaction(async (tx) => {
      await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: { workspaceId: invite.workspaceId, userId: req.userId! },
        },
        update: {},
        create: { workspaceId: invite.workspaceId, userId: req.userId!, role: invite.role },
      });
      await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    });

    res.json({ workspaceId: invite.workspaceId });
  } catch (err) {
    next(err);
  }
});

workspacesRouter.use("/:workspaceId/issues", requireWorkspaceMember, issuesRouter);