/**
 * Renders a status label using the scaffold status class that matches it.
 * Unknown statuses render as plain text with no status class.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
const STATUS_CLASSES = {
  Paid: 'status-paid',
  Open: 'status-open',
  Unpaid: 'status-unpaid',
  Overdue: 'status-overdue',
};

export default function StatusBadge({ status }) {
  const className = STATUS_CLASSES[status] ?? '';
  return <span className={className}>{status}</span>;
}
