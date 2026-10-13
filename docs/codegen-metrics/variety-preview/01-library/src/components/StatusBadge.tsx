export default function StatusBadge({ status }: { status: string }) {
  return <span className={'status-' + String(status || '').toLowerCase()}>{status}</span>
}
