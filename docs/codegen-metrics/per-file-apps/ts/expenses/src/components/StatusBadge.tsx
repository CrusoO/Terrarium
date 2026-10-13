export default function StatusBadge({ status }: { status: string }) {
  const known = ["paid", "open", "unpaid", "overdue"];
  const key = status.trim().toLowerCase();
  const className = known.includes(key) ? `status-${key}` : undefined;

  return <span className={className}>{status}</span>;
}
