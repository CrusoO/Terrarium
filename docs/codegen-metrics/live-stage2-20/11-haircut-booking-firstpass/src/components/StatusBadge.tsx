const STATUS_CLASS: Record<string, string> = {
  available: 'status-open',
  booked: 'status-unpaid',
  completed: 'status-paid',
  cancelled: 'status-overdue',
}

export default function StatusBadge({ status }: { status: string }) {
  const text = String(status ?? '')
  const className = STATUS_CLASS[text.toLowerCase()] ?? ''
  return <span className={className}>{text}</span>
}
