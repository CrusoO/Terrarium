/**
 * StatusBadge renders a status label with the scaffold status class.
 *
 * @param {Object} props
 * @param {string} props.status - Status label, for example "Paid".
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
