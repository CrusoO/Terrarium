import type { ReactElement } from "react";

const STATUS_CLASS: Record<string, string> = {
  Open: "status-open",
  Done: "status-paid",
  Paid: "status-paid",
  Unpaid: "status-unpaid",
  Overdue: "status-overdue",
};

export default function StatusBadge({ status }: { status: string }): ReactElement {
  const className = STATUS_CLASS[status] ?? "";
  return <span className={className}>{status}</span>;
}
