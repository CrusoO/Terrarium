type StatusBadgeProps = {
  status: string
}

const STATUS_CLASS: Record<string, string> = {
  started: 'status-overdue',
  details_entered: 'status-unpaid',
  contact_added: 'status-open',
  completed: 'status-paid',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const text = String(status ?? '')
  const className = STATUS_CLASS[text] ?? 'status-open'
  const label = text.replace(/_/g, ' ')

  return <span className={className}>{label}</span>
}
