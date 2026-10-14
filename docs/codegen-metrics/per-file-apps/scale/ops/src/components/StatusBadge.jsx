/**
 * StatusBadge
 *
 * Leaf component that renders a status label with the scaffold-owned
 * status class. Accepts any status string so callers passing values
 * outside Open/Done/Overdue (for example "Paid") still render.
 *
 * @param {Object} props
 * @param {string} props.status - Status value, such as "Open", "Done", "Overdue", or "Paid".
 * @returns {JSX.Element}
 */
const STATUS_CLASS_BY_NAME = {
  open: 'status-open',
  done: 'status-paid',
  paid: 'status-paid',
  unpaid: 'status-unpaid',
  overdue: 'status-overdue',
};

export default function StatusBadge({ status }) {
  const text = typeof status === 'string' ? status : '';
  const key = text.trim().toLowerCase();
  const className = STATUS_CLASS_BY_NAME[key] || '';

  return <span className={className}>{text}</span>;
}
