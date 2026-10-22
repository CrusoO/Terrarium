interface StatusBadgeProps {
  status: string;
}

const STATUS_CLASS: Record<string, string> = {
  Paid: 'status-paid',
  Pending: 'status-open',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = String(status ?? '');
  const className = STATUS_CLASS[label] ?? 'status-unpaid';
  return <span className={className}>{label}</span>;
}
