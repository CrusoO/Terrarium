import type { ReactElement } from 'react'

const STATUS_CLASSES: Record<string, string> = {
  Proofing: 'status-open',
  Baked: 'status-paid',
  Paid: 'status-paid',
  Overdue: 'status-overdue',
}

export default function StatusBadge({ status }: { status: string }): ReactElement {
  const label = String(status ?? '')
  const className = STATUS_CLASSES[label] ?? 'status-unpaid'
  return <span className={className}>{label}</span>
}
