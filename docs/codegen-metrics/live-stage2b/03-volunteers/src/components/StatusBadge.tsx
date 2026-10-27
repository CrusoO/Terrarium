type StatusBadgeProps = {
  status: string
}

const STATUS_CLASS: Record<string, string> = {
  Confirmed: 'status-paid',
  Waitlist: 'status-open',
  Declined: 'status-overdue',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = String(status ?? '')
  const className = STATUS_CLASS[label] ?? 'status-unpaid'
  return <span className={className}>{label}</span>
}
