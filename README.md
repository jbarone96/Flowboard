# Flowboard

A multi-tenant issue tracker, built around two hard problems: keeping every
workspace's data fully isolated from every other workspace, and syncing
changes live across everyone viewing the same board — without either one
compromising the other.

**Live demo:** https://flowboard-two-zeta.vercel.app/

## Why I built this

Most portfolio CRUD apps don't have to think hard about isolation or
concurrency. This one does, twice: making sure one team's issues can never
leak into another team's view (even under a buggy or malicious request),
and making real-time updates respect that same boundary instead of
broadcasting everything to everyone. Those two problems — and a genuine bug
I found and fixed while building the second one — are the actual point of
this project.

## Features

- Multi-tenant workspaces with role-based membership (Admin / Member)
- A kanban board (Todo / In Progress / Done) scoped to each workspace
- Real-time sync — issue creation, status, priority, and assignee changes
  appear live for everyone viewing the same board, no refresh
- Assign issues to teammates from a workspace's member list
- Token-based invite links (admin-only), with a redirect flow that carries
  someone through signup and straight into the workspace they were invited to
- Priority-colored issue cards (a git-diff-marker-style left edge)

## Stack

- **Frontend:** React + TypeScript, React Router, Socket.io client, Vite
- **Backend:** Node + Express + TypeScript, Prisma ORM, Socket.io
- **Database:** PostgreSQL
- **Testing:** Vitest
- **CI:** GitHub Actions

## Design

Issue cards use a colored left edge to signal priority — a git-diff-marker
visual language, deliberately reading as a tool built by someone who thinks
like an engineer. A pulsing green "Live" badge appears only while the
WebSocket connection is actually active, so its presence always means
exactly one thing. Assignee, priority, and status each collapse to plain
labeled text at rest, expanding into a small custom dropdown on click.
Built around Space Grotesk and JetBrains Mono.

## Architecture decisions

### Tenant isolation is enforced at every query, not just at the gate

`requireWorkspaceMember` middleware verifies the requester belongs to the
workspace before any route handler runs — but that alone isn't enough.
Every issue mutation additionally uses `updateMany`/`deleteMany` with
**both** `id` and `workspaceId` in the `where` clause
(`backend/src/routes/issues.ts`), instead of `update`/`delete` by `id`
alone. Without this, a request that passed the membership check for
workspace A could still mutate a row belonging to workspace B, just by
supplying that row's `id` — the URL's `workspaceId` would be validated but
never actually connected to which row gets written. Filtering the mutation
itself closes that gap: a mismatched combination matches zero rows, which
the API turns into a 404.

### Real-time events are scoped to workspace-specific Socket.io rooms

Every connected client authenticates over the socket handshake (the same
JWT used for REST), then explicitly joins a room named after the workspace
they're viewing (`backend/src/socket.ts`). All broadcasts use
`io.to(workspaceId).emit(...)` — never a global emit. A client that hasn't
joined a given workspace's room simply never receives its events, the same
way a REST query scoped to `workspaceId` never returns another tenant's
rows. Two different mechanisms, same underlying rule, enforced
consistently across both the request/response and the real-time layer.

### A real bug this approach caught: Express 5's `app.use()` param handling

Issue routes were originally mounted directly on the Express app with an
inline dynamic segment:
`app.use("/api/workspaces/:workspaceId/issues", requireAuth, requireWorkspaceMember, issuesRouter)`.
This left `req.params.workspaceId` undefined inside `requireWorkspaceMember`
under Express 5, even though the identical pattern worked for a route
declared directly inside a router. The fix was to mount `issuesRouter` as a
proper nested sub-router of `workspacesRouter`, using Express's
`mergeParams: true` option — the standard, documented mechanism for handing
a parent route's params down to a child router — rather than relying on
`app.use()`'s inline path-matching to do it implicitly.

### Another real bug: native `<select>` doesn't always fire `onChange`

Issue cards originally used native `<select>` elements for editing status,
priority, and assignee. Re-selecting the value that was already chosen
doesn't fire `onChange` (no value changed) — and critically, it also
doesn't fire `onBlur`, since focus never leaves the element. With neither
event firing, there was no reliable way to collapse the field back to
text. The fix was a small custom `Dropdown` component
(`frontend/src/components/Dropdown.tsx`) where every option is a real
`onClick`, closing the menu deterministically regardless of whether the
selected value actually changed.

### Workspace creation happens inside a database transaction

Creating a workspace and adding its creator as `ADMIN` are two separate
writes (`backend/src/routes/workspaces.ts`) that must succeed or fail
together. Wrapped in `prisma.$transaction`, a crash between the two writes
can't leave an orphaned workspace with zero members — which would otherwise
be permanently inaccessible, since every route that touches a workspace
requires an existing membership row to even view it.

### Membership checks return 404, not 403

`requireWorkspaceMember` returns the same 404 for "workspace doesn't exist"
and "workspace exists but you're not a member" — deliberately not a 403.
A 403 confirms the resource exists to someone who can't access it, which
leaks information; a 404 reveals nothing either way.

## What's intentionally out of scope

- Comments or an activity feed on issues
- File attachments
- Drag-and-drop reordering (status changes work via a dropdown — the
  real-time sync story is identical either way; drag-and-drop would add UI
  complexity without adding to the underlying engineering problem)
- Nested sub-teams within a workspace
- Real email delivery for invites — the invite link itself carries the
  token; sharing it is manual for the MVP

## Running locally

### Prerequisites
- Node 20+
- PostgreSQL running locally (or a hosted instance)

### Backend

```bash
cd backend
cp .env.example .env    # fill in DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev               # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Sign up, create a workspace, and you're on the board. Open a second
browser tab on the same board to see real-time sync in action.

### Tests

```bash
cd backend
npm test
```

Covers the pure workspace-slug generation logic (uniqueness suffix,
special-character handling, whitespace trimming).

## Deployment notes

- **Frontend:** deployed to Vercel; `VITE_API_URL` points at the Railway
  backend.
- **Backend:** deployed to Railway, alongside a managed Postgres instance;
  `FRONTEND_URL` is set to the Vercel origin (used for both CORS and the
  Socket.io handshake's allowed origin).
- **Database:** Postgres, migrated with `npx prisma migrate deploy` on
  every deploy.