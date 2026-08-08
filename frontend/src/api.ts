const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  role?: "ADMIN" | "MEMBER";
}

export interface WorkspaceMember {
  id: string;
  role: "ADMIN" | "MEMBER";
  user: User;
}

export interface Issue {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignee: { id: string; name: string } | null;
  creator: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  signup: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getWorkspaces: () => request<{ workspaces: Workspace[] }>("/workspaces"),

  createWorkspace: (name: string) =>
    request<{ workspace: Workspace }>("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getWorkspace: (workspaceId: string) =>
    request<{ workspace: Workspace; role: "ADMIN" | "MEMBER" }>(`/workspaces/${workspaceId}`),

  getMembers: (workspaceId: string) =>
    request<{ members: WorkspaceMember[] }>(`/workspaces/${workspaceId}/members`),

  createInvite: (workspaceId: string, email: string, role: "ADMIN" | "MEMBER") =>
    request<{ invite: unknown; inviteLink: string }>(`/workspaces/${workspaceId}/invites`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),

  acceptInvite: (token: string) =>
    request<{ workspaceId: string }>(`/workspaces/invites/${token}/accept`, {
      method: "POST",
    }),

  getIssues: (workspaceId: string) => request<{ issues: Issue[] }>(`/workspaces/${workspaceId}/issues`),

  createIssue: (
    workspaceId: string,
    payload: { title: string; description?: string; priority?: Issue["priority"]; assigneeId?: string }
  ) =>
    request<{ issue: Issue }>(`/workspaces/${workspaceId}/issues`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateIssue: (
    workspaceId: string,
    issueId: string,
    payload: Partial<Pick<Issue, "title" | "description" | "status" | "priority">> & { assigneeId?: string | null }
  ) =>
    request<{ issue: Issue }>(`/workspaces/${workspaceId}/issues/${issueId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteIssue: (workspaceId: string, issueId: string) =>
    request<{ ok: true }>(`/workspaces/${workspaceId}/issues/${issueId}`, {
      method: "DELETE",
    }),
};