export default function StatusBadge({ status }: { status: string }) {
  const value = String(status ?? '')
  return (
    <span className={`status-${value.toLowerCase()}`}>{value}</span>
  )
}
