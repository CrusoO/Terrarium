/**
 * StatusBadge renders a status label styled by the scaffold stylesheet.
 *
 * @param {Object} props
 * @param {string} props.status - Status value, e.g. "Open", "Done", "Overdue", or "Paid".
 * @returns {JSX.Element}
 */
const STATUS_CLASSES = {
  open: 'status-open',
  paid: 'status-paid',
  unpaid: 'status-unpaid',
  overdue: 'status-overdue',
};

export default function StatusBadge({ status }) {
  const label = typeof status === 'string' ? status : '';
  const key = label.trim().toLowerCase();
  const className = STATUS_CLASSES[key] || `status-${key.replace(/\s+/g, '-')}`;

  return <span className={className}>{label}</span>;
}
