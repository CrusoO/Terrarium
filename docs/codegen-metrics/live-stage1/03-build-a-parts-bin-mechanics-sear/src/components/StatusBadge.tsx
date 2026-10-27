export default function StatusBadge({ status }: { status: string }) {
  const value = String(status ?? '')
  const cls =
    value === 'Open' ? 'status-open' :
    value === 'Done' || value === 'Paid' ? 'status-paid' :
    value === 'Unpaid' ? 'status-unpaid' :
    value === 'Overdue' ? 'status-overdue' :
    ''
  return <span className={cls}>{value}</span>
}
