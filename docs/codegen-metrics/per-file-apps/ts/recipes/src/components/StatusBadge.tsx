import type { ReactElement } from "react";

const STATUS_CLASS: Record<string, string> = {
  Paid: "status-paid",
  Open: "status-open",
  Unpaid: "status-unpaid",
  Overdue: "status-overdue",
};

type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  const className = Object.prototype.hasOwnProperty.call(STATUS_CLASS, status)
    ? STATUS_CLASS[status]
    : "";

  return <span className={className}>{status}</span>;
}
