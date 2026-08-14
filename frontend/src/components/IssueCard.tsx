import type { Issue, WorkspaceMember } from "../api";
import { Dropdown } from "./Dropdown";

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
  const statusLabel = STATUSES.find((s) => s.status === issue.status)?.label ?? issue.status;

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...members.map((m) => ({ value: m.user.id, label: m.user.name })),
  ];

  return (
    <div className="issue-card" data-priority={issue.priority}>
      <p className="issue-title">{issue.title}</p>

      <Dropdown
        options={assigneeOptions}
        displayLabel={issue.assignee?.name ?? "Unassigned"}
        onSelect={(value) => onAssigneeChange(value || null)}
      />
      {members.length <= 1 && (
        <p style={{ fontSize: 12, color: "var(--ink-faint)", margin: "-4px 0 8px" }}>
          Invite a teammate to assign issues to them.
        </p>
      )}

      <Dropdown
        options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        displayLabel={issue.priority}
        onSelect={(value) => onPriorityChange(value as Issue["priority"])}
      />

      <Dropdown
        options={STATUSES.map((s) => ({ value: s.status, label: s.label }))}
        displayLabel={statusLabel}
        onSelect={(value) => onStatusChange(value as Issue["status"])}
      />
    </div>
  );
}