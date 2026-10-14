type StatusBadgeProps = {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className="status-badge" data-status={String(status ?? '')}>
      {String(status ?? '')}
    </span>
  )
}
