interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const value = String(status ?? '');
  return (
    <span className="status-badge" data-status={value}>
      {value}
    </span>
  );
}
