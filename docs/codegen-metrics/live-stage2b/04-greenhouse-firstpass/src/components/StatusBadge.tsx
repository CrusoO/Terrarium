interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = String(status ?? '')
  return (
    <span className="status-badge" data-status={label}>
      {label}
    </span>
  )
}
