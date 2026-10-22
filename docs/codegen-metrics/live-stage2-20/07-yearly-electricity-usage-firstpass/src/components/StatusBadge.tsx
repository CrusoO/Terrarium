type Props = {
  status: string
}

export default function StatusBadge({ status }: Props) {
  const label = String(status ?? '')
  const cls = `status-${label.toLowerCase()}`
  return <span className={cls}>{label}</span>
}
