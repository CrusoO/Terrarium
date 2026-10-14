import type { ReactElement } from 'react'

export interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  const label = String(status ?? '')
  const modifier = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return <span className={`status-badge status-${modifier}`}>{label}</span>
}
