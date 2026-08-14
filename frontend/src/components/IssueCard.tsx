import { useState } from "react";
import type { Issue, WorkspaceMember } from "../api";

const PRIORITIES: Issue["priority"][] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES: { status: Issue["status"]; label: string }[] = [
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];

interface IssueCardProps {
  issue: Issue;
  members: WorkspaceMember[];
  onStatusChange: (status: Issue["status"]) => void;
  onPriorityChange: (priority: Issue["priority"]) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
}

export function IssueCard({
  issue,
  members,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
}: IssueCardProps) {
  const [editingPriority, setEditingPriority] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);

  const statusLabel = STATUSES.find((s) => s.status === issue.status)?.label ?? issue.status;

  return (
    <div className="issue-card" data-priority={issue.priority}>
      <p className="issue-title">{issue.title}</p>

      {editingAssignee ? (
        <select
          autoFocus
          value={issue.assignee?.id ?? ""}
          onChange={(e) => {
            onAssigneeChange(e.target.value || null);
            setEditingAssignee(false);
          }}
          onBlur={() => setEditingAssignee(false)}
          style={{ marginBottom: 8 }}
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.user.id} value={m.user.id}>
              {m.user.name}
            </option>
          ))}
        </select>
      ) : (
        <p
          className="issue-meta"
          onClick={() => setEditingAssignee(true)}
          style={{ cursor: "pointer", textDecoration: "underline dotted", marginBottom: 8 }}
        >
          {issue.assignee?.name ?? "Unassigned"}
        </p>
      )}

      {editingPriority ? (
        <select
          autoFocus
          value={issue.priority}
          onChange={(e) => {
            onPriorityChange(e.target.value as Issue["priority"]);
            setEditingPriority(false);
          }}
          onBlur={() => setEditingPriority(false)}
          style={{ marginBottom: 8 }}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      ) : (
        <p
          className="issue-meta"
          onClick={() => setEditingPriority(true)}
          style={{ cursor: "pointer", textDecoration: "underline dotted", marginBottom: 8 }}
        >
          {issue.priority}
        </p>
      )}

      {editingStatus ? (
        <select
          autoFocus
          value={issue.status}
          onChange={(e) => {
            onStatusChange(e.target.value as Issue["status"]);
            setEditingStatus(false);
          }}
          onBlur={() => setEditingStatus(false)}
        >
          {STATUSES.map((s) => (
            <option key={s.status} value={s.status}>
              {s.label}
            </option>
          ))}
        </select>
      ) : (
        <p
          className="issue-meta"
          onClick={() => setEditingStatus(true)}
          style={{ cursor: "pointer", textDecoration: "underline dotted", margin: 0 }}
        >
          {statusLabel}
        </p>
      )}
    </div>
  );
}