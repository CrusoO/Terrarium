const STATUS_CLASS: Record<string, string> = {
  '1': 'status-overdue',
  '2': 'status-unpaid',
  '3': 'status-open',
  '4': 'status-paid',
  paid: 'status-paid',
  open: 'status-open',
  unpaid: 'status-unpaid',
  overdue: 'status-overdue',
}

export default function StatusBadge({ status }: { status: string }) {
  const label = String(status ?? '')
  const key = label.toLowerCase()
  const cls = STATUS_CLASS[key] ?? 'status-open'
  return <span className={cls}>{label}</span>
}
