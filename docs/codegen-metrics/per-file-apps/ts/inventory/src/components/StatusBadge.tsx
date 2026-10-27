import type { JSX } from "react";

const STATUS_CLASS: Record<string, string> = {
  Ok: "status-paid",
  Low: "status-open",
  Out: "status-overdue",
  Paid: "status-paid",
  Open: "status-open",
  Unpaid: "status-unpaid",
  Overdue: "status-overdue",
};

export interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  const className = STATUS_CLASS[status] ?? "status-unpaid";
  return <span className={className}>{status}</span>;
}
