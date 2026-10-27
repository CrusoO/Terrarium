import type { JSX } from "react";

const STATUS_CLASS: Record<string, string> = {
  Open: "status-open",
  Paid: "status-paid",
  Unpaid: "status-unpaid",
  Overdue: "status-overdue",
};

export default function StatusBadge({ status }: { status: string }): JSX.Element {
  const modifier = STATUS_CLASS[status] ?? "";
  const className = modifier ? modifier : undefined;

  return <span className={className}>{status}</span>;
}
