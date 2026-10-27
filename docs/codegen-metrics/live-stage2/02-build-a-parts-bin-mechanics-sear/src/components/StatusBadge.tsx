import type { ReactElement } from 'react'

const STATUS_CLASS: Record<string, string> = {
  open: 'status-open',
  done: 'status-paid',
  paid: 'status-paid',
  unpaid: 'status-unpaid',
  overdue: 'status-overdue',
}

export default function StatusBadge({ status }: { status: string }): ReactElement {
  const label = String(status ?? '')
  const className = STATUS_CLASS[label.toLowerCase()] ?? ''

  return <span className={className}>{label}</span>
}
