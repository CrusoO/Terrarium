const STATUS_CLASS: Record<string, string> = {
  'date-selection': 'status-open',
  'guest-details': 'status-unpaid',
  'catering-choice': 'status-overdue',
  'contact-submitted': 'status-paid',
}

export default function StatusBadge({ status }: { status: string }) {
  const label = String(status ?? '')
  const className = STATUS_CLASS[label] ?? 'status-open'
  return <span className={className}>{label}</span>
}
