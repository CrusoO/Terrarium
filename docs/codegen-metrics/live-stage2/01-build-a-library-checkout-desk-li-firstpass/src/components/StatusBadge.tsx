export interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = String(status ?? '')
  const className = `status-${label.toLowerCase()}`

  return <span className={className}>{label}</span>
}
