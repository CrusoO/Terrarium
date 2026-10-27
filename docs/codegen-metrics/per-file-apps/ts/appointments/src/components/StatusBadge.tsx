import type { JSX } from "react";

const STATUS_CLASS: Record<string, string> = {
  Booked: "status-open",
  Done: "status-paid",
  Cancelled: "status-overdue",
  Paid: "status-paid",
  Open: "status-open",
  Unpaid: "status-unpaid",
  Overdue: "status-overdue",
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  const className = STATUS_CLASS[status] ?? "status-unpaid";
  return <span className={className}>{status}</span>;
}
