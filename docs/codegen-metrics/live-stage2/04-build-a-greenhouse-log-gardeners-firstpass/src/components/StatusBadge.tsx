import type { ReactElement } from 'react'

export interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  const label = String(status ?? '')
  const cls = `status-${label.toLowerCase()}`
  return <span className={cls}>{label}</span>
}
