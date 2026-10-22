export default function StatusBadge({ status }: { status: string }) {
  const classByStatus: Record<string, string> = {
    Yes: "status-paid",
    Maybe: "status-open",
    No: "status-unpaid",
  };
  const className = classByStatus[status] ?? "";

  return <span className={className}>{status}</span>;
}
