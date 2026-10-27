import type { ReactElement } from 'react'

type StatusBadgeProps = {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  const label = String(status ?? '')
  const modifier = label.toLowerCase()
  return <span className={`status-badge status-${modifier}`}>{label}</span>
}
