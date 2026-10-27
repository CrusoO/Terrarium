/**
 * Status pill for a ticket status (Open, Waiting, Closed).
 * Uses only scaffold-owned status classes. Unknown values such as "Paid" render as plain text.
 * @param {{ status: string }} props
 */
const STATUS_CLASS = {
  Open: 'status-open',
  Waiting: 'status-unpaid',
  Closed: 'status-paid',
}

export default function StatusBadge({ status }) {
  const className = STATUS_CLASS[status]

  return <span className={className}>{status}</span>
}
