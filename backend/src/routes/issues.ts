import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { AppError } from "../middleware/errorHandler";
import { requireWorkspaceMember, WorkspaceScopedRequest } from "../middleware/requireWorkspaceMember";
import { emitToWorkspace } from "../socket";

export const issuesRouter = Router({ mergeParams: true });

// Every route in this file is mounted under /workspaces/:workspaceId/issues
// and sits behind requireWorkspaceMember — see workspaces.ts for the mount
// point. That middleware is what guarantees every query below can safely
// trust req.workspaceId as "a workspace this user actually belongs to."

issuesRouter.get("/", requireWorkspaceMember, async (req: WorkspaceScopedRequest, res, next) => {
  try {
    const issues = await prisma.issue.findMany({
      // This where clause is the tenant-isolation boundary for issue data.
      // Every read and write in this file filters by workspaceId; there is
      // no query anywhere that fetches issues without it.
      where: { workspaceId: req.workspaceId },
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ issues });
  } catch (err) {
    next(err);
  }
});

const createIssueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().optional(),
});

issuesRouter.post("/", requireWorkspaceMember, async (req: WorkspaceScopedRequest, res, next) => {
  try {
    const data = createIssueSchema.parse(req.body);

    if (data.assigneeId) {
      await assertAssigneeIsMember(req.workspaceId!, data.assigneeId);
    }

    const issue = await prisma.issue.create({
      data: {
        ...data,
        workspaceId: req.workspaceId!,
        creatorId: req.userId!,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    emitToWorkspace(req.workspaceId!, "issue:created", issue);
    res.status(201).json({ issue });
  } catch (err) {
    next(err);
  }
});

const updateIssueSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

issuesRouter.patch("/:issueId", requireWorkspaceMember, async (req: WorkspaceScopedRequest, res, next) => {
  try {
    const issueId = req.params.issueId as string;
    const data = updateIssueSchema.parse(req.body);

    if (data.assigneeId) {
      await assertAssigneeIsMember(req.workspaceId!, data.assigneeId);
    }

    // updateMany (not update) specifically so we can filter by workspaceId
    // in the same query, rather than fetching the issue first and checking
    // its workspaceId in application code. If issueId exists but belongs to
    // a different workspace, this matches zero rows instead of leaking a
    // cross-tenant write.
    const result = await prisma.issue.updateMany({
      where: { id: issueId, workspaceId: req.workspaceId },
      data,
    });

    if (result.count === 0) throw new AppError("Issue not found", 404);

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    emitToWorkspace(req.workspaceId!, "issue:updated", issue);
    res.json({ issue });
  } catch (err) {
    next(err);
  }
});

issuesRouter.delete("/:issueId", requireWorkspaceMember, async (req: WorkspaceScopedRequest, res, next) => {
  try {
    const issueId = req.params.issueId as string;

    const result = await prisma.issue.deleteMany({
      where: { id: issueId, workspaceId: req.workspaceId },
    });

    if (result.count === 0) throw new AppError("Issue not found", 404);

    emitToWorkspace(req.workspaceId!, "issue:deleted", { id: issueId });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

async function assertAssigneeIsMember(workspaceId: string, assigneeId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: assigneeId } },
  });
  if (!membership) throw new AppError("Assignee must be a member of this workspace", 400);
}