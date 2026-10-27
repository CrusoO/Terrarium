export default function StatusBadge({ status }: { status: string }) {
  const key = status.trim().toLowerCase();
  const knownStatuses = ["paid", "open", "unpaid", "overdue"];
  const className = knownStatuses.includes(key) ? `status-${key}` : undefined;

  return <span className={className}>{status}</span>;
}
