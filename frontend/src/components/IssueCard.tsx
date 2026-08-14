import type { Issue, WorkspaceMember } from "../api";
import { Dropdown } from "./Dropdown";

const PRIORITIES: Issue["priority"][] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES: { status: Issue["status"]; label: string }[] = [
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];

function toTitleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

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
        label="Assignee"
        options={assigneeOptions}
        displayLabel={issue.assignee?.name ?? "Unassigned"}
        onSelect={(value) => onAssigneeChange(value || null)}
      />
      {members.length <= 1 && (
        <p style={{ fontSize: 12, color: "var(--ink-faint)", margin: "-6px 0 12px" }}>
          Invite a teammate to assign issues to them.
        </p>
      )}

      <Dropdown
        label="Priority"
        options={PRIORITIES.map((p) => ({ value: p, label: toTitleCase(p) }))}
        displayLabel={toTitleCase(issue.priority)}
        onSelect={(value) => onPriorityChange(value as Issue["priority"])}
      />

      <Dropdown
        label="Status"
        options={STATUSES.map((s) => ({ value: s.status, label: s.label }))}
        displayLabel={statusLabel}
        onSelect={(value) => onStatusChange(value as Issue["status"])}
      />
    </div>
  );
}