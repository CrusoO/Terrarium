interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const value = String(status ?? '');
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <span className={`status-badge status-${slug}`}>
      <span className="status-label">Status: </span>
      <span className="status-value">{value}</span>
    </span>
  );
}
