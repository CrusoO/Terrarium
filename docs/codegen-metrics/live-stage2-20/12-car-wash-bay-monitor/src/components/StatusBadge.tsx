type StatusBadgeProps = {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = String(status ?? '')
  const slug = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <span className={`status-badge status-${slug}`}>{label}</span>
  )
}
