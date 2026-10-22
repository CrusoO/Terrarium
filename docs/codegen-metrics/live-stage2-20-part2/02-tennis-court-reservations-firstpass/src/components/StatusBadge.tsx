type StatusBadgeProps = {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = String(status ?? '')
  const cls = `status-${label.toLowerCase()}`
  return <span className={cls}>{label}</span>
}
