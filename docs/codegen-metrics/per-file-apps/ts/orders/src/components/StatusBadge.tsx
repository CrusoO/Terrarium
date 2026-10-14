import React from "react";

const STATUS_CLASS: Record<string, string> = {
  Paid: "status-paid",
  Unpaid: "status-unpaid",
  Partial: "status-open",
};

export default function StatusBadge({ status }: { status: string }) {
  const className = STATUS_CLASS[status] ?? "";
  return <span className={className}>{status}</span>;
}
