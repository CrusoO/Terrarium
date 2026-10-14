/**
 * Renders a payment status as a small badge.
 * Styling comes from the scaffold stylesheet via the status-* class names.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - One of "Paid", "Unpaid", "Partial".
 * @returns {JSX.Element}
 */
const CLASS_BY_STATUS = {
  Paid: 'status-paid',
  Unpaid: 'status-unpaid',
  Partial: 'status-open',
};

export default function StatusBadge({ status }) {
  const className = CLASS_BY_STATUS[status] ?? 'status-open';
  return <span className={className}>{status}</span>;
}
