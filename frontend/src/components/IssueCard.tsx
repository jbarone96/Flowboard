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

  const statusLabel =
    STATUSES.find((s) => s.status === issue.status)?.label ?? issue.status;

  return (
    <div className="issue-card" data-priority={issue.priority}>
      <p className="issue-title">{issue.title}</p>

      {editingAssignee ? (
        <>
          <select
            autoFocus
            value={issue.assignee?.id ?? ""}
            onChange={(e) => {
              const newAssigneeId = e.target.value || null;
              if (newAssigneeId !== (issue.assignee?.id ?? null)) {
                onAssigneeChange(newAssigneeId);
              }
              setEditingAssignee(false);
            }}
            onBlur={() => setEditingAssignee(false)}
            style={{ marginBottom: members.length <= 1 ? 4 : 8 }}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ))}
          </select>
          {members.length <= 1 && (
            <p
              style={{
                fontSize: 12,
                color: "var(--ink-faint)",
                margin: "0 0 8px",
              }}
            >
              Invite a teammate to assign issues to them.
            </p>
          )}
        </>
      ) : (
        <p
          className="issue-meta"
          onClick={() => setEditingAssignee(true)}
          style={{
            cursor: "pointer",
            textDecoration: "underline dotted",
            marginBottom: 8,
          }}
        >
          {issue.assignee?.name ?? "Unassigned"}
        </p>
      )}

      {editingPriority ? (
        <select
          autoFocus
          value={issue.priority}
          onChange={(e) => {
            const newPriority = e.target.value as Issue["priority"];
            if (newPriority !== issue.priority) {
              onPriorityChange(newPriority);
            }
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
          style={{
            cursor: "pointer",
            textDecoration: "underline dotted",
            marginBottom: 8,
          }}
        >
          {issue.priority}
        </p>
      )}

      {editingStatus ? (
        <select
          autoFocus
          value={issue.status}
          onChange={(e) => {
            const newStatus = e.target.value as Issue["status"];
            if (newStatus !== issue.status) {
              onStatusChange(newStatus);
            }
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
          style={{
            cursor: "pointer",
            textDecoration: "underline dotted",
            margin: 0,
          }}
        >
          {statusLabel}
        </p>
      )}
    </div>
  );
}
