export default function StatusBadge({ status }: { status: string }) {
  const STATUS_CLASS: Record<string, string> = {
    Open: 'status-open',
    Done: '',
    Paid: 'status-paid',
    Unpaid: 'status-unpaid',
    Overdue: 'status-overdue',
  };
  const label = String(status ?? '');
  const className = STATUS_CLASS[label] ?? '';
  return <span className={className || undefined}>{label}</span>;
}
