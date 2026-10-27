import type { ReactElement } from 'react'

type StatusBadgeProps = {
  status: string
  onOpen?: (id: string) => void
  onDone?: () => void
}

const STATUS_CLASSES: Record<string, string> = {
  completed: 'status-paid',
  pending: 'status-open',
  voided: 'status-overdue',
}

export default function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  const label = String(status ?? '')
  const key = label.toLowerCase()
  const className = STATUS_CLASSES[key] ?? 'status-unpaid'

  return <span className={className}>{label}</span>
}
