import type { ReactElement } from "react";

const STATUS_CLASS: Record<string, string> = {
  Paid: "status-paid",
  Open: "status-open",
  Unpaid: "status-unpaid",
  Overdue: "status-overdue",
  Present: "status-paid",
  Late: "status-unpaid",
  Absent: "status-overdue",
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  const className = STATUS_CLASS[status];
  return <span className={className}>{status}</span>;
}
