import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { Issue, Workspace, WorkspaceMember } from "../api";
import { IssueCard } from "../components/IssueCard";
import { getSocket, joinWorkspace, leaveWorkspace } from "../socket";

const COLUMNS: { status: Issue["status"]; label: string }[] = [
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];

const PRIORITIES: Issue["priority"][] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function Board() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Issue["priority"]>("MEDIUM");
  const [connected, setConnected] = useState(() => getSocket().connected);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    if (!workspaceId) return;

    Promise.all([
      api.getWorkspace(workspaceId),
      api.getIssues(workspaceId),
      api.getMembers(workspaceId),
    ])
      .then(([wsRes, issuesRes, membersRes]) => {
        setWorkspace(wsRes.workspace);
        setRole(wsRes.role);
        setIssues(issuesRes.issues);
        setMembers(membersRes.members);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const socket = getSocket();
    joinWorkspace(workspaceId);

    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onCreated(issue: Issue) {
      setIssues((prev) =>
        prev.some((i) => i.id === issue.id) ? prev : [issue, ...prev],
      );
    }
    function onUpdated(issue: Issue) {
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? issue : i)));
    }
    function onDeleted(payload: { id: string }) {
      setIssues((prev) => prev.filter((i) => i.id !== payload.id));
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("issue:created", onCreated);
    socket.on("issue:updated", onUpdated);
    socket.on("issue:deleted", onDeleted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("issue:created", onCreated);
      socket.off("issue:updated", onUpdated);
      socket.off("issue:deleted", onDeleted);
      leaveWorkspace(workspaceId);
    };
  }, [workspaceId]);

  async function handleCreateIssue() {
    if (!newTitle.trim() || !workspaceId) return;
    try {
      await api.createIssue(workspaceId, {
        title: newTitle.trim(),
        priority: newPriority,
      });
      setNewTitle("");
      setNewPriority("MEDIUM");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }
  }

  async function handleStatusChange(issue: Issue, status: Issue["status"]) {
    if (!workspaceId) return;
    try {
      await api.updateIssue(workspaceId, issue.id, { status });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }
  }

  async function handlePriorityChange(
    issue: Issue,
    priority: Issue["priority"],
  ) {
    if (!workspaceId) return;
    try {
      await api.updateIssue(workspaceId, issue.id, { priority });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }
  }

  async function handleAssigneeChange(issue: Issue, assigneeId: string | null) {
    if (!workspaceId) return;
    try {
      await api.updateIssue(workspaceId, issue.id, { assigneeId });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !workspaceId) return;
    try {
      const res = await api.createInvite(
        workspaceId,
        inviteEmail.trim(),
        "MEMBER",
      );
      setInviteLink(`${window.location.origin}${res.inviteLink}`);
      setInviteEmail("");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }
  }

  if (loading) {
    return <div className="container">Loading board...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 960 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ marginBottom: 4 }}>{workspace?.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {connected && (
            <span className="live-badge">
              <span className="live-dot" />
              Live
            </span>
          )}
          {role === "ADMIN" && (
            <button
              className="nav-button"
              style={{
                width: "auto",
                color: "var(--teal)",
                borderColor: "var(--teal)",
              }}
              onClick={() => setShowInvite((v) => !v)}
            >
              Invite teammate
            </button>
          )}
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      {showInvite && (
        <div className="card">
          <h3>Invite a teammate</h3>
          <input
            placeholder="teammate@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button
            className="primary"
            onClick={handleInvite}
            disabled={!inviteEmail.trim()}
          >
            Generate invite link
          </button>
          {inviteLink && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                wordBreak: "break-all",
              }}
            >
              {inviteLink}
            </p>
          )}
        </div>
      )}

      <div className="card">
        <input
          placeholder="New issue title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateIssue();
          }}
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as Issue["priority"])}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <button
          className="primary"
          onClick={handleCreateIssue}
          disabled={!newTitle.trim()}
        >
          Add issue
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {COLUMNS.map((col) => {
          const columnIssues = issues.filter((i) => i.status === col.status);
          return (
            <div
              key={col.status}
              className="board-column"
              data-status={col.status}
            >
              <h3>
                {col.label} · {columnIssues.length}
              </h3>
              {columnIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  members={members}
                  onStatusChange={(status) => handleStatusChange(issue, status)}
                  onPriorityChange={(priority) =>
                    handlePriorityChange(issue, priority)
                  }
                  onAssigneeChange={(assigneeId) =>
                    handleAssigneeChange(issue, assigneeId)
                  }
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
