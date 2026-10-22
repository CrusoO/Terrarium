export default function StatusBadge({ status }: { status: string }) {
  const label = String(status ?? '')
  return <span className={`status-${label.toLowerCase()}`}>{label}</span>
}
