/**
 * StatusBadge: a leaf component that renders a status label with the
 * scaffold-owned status class. Known statuses map to a scaffold class.
 * Any other value, such as Kitchen, Garden, or Desk, renders as plain text.
 *
 * @param {Object} props
 * @param {string} props.status - The status label to display, e.g. "Paid".
 * @returns {JSX.Element}
 */
const STATUS_CLASSES = {
  paid: 'status-paid',
  open: 'status-open',
  unpaid: 'status-unpaid',
  overdue: 'status-overdue'
}

export default function StatusBadge({ status }) {
  const text = String(status ?? '')
  const key = text.trim().toLowerCase()
  const className = STATUS_CLASSES[key] ?? ''

  return <span className={className}>{text}</span>
}
