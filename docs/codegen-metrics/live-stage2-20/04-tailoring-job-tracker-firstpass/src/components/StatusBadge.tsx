interface StatusBadgeProps {
  status: string
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'status-open',
  'in-progress': 'status-unpaid',
  finished: 'status-paid',
  delivered: 'status-paid',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const text = String(status ?? '')
  const key = text.toLowerCase()
  const cls = STATUS_CLASS[key] ?? 'status-open'
  return <span className={cls}>{text}</span>
}
