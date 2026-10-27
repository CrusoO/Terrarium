interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = String(status ?? '')
  const modifier = label.toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-${modifier}`}>{label}</span>
}
