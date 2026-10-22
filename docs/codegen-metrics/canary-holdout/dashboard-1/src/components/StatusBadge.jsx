/**
 * StatusBadge: leaf component that shows a paymentStatus value as a styled badge.
 * Styling comes from the scaffold stylesheet classes only.
 */

/**
 * @typedef {Object} StatusBadgeProps
 * @property {string} status
 */

/** @type {Record<string, string>} */
const STATUS_CLASS = {
  Paid: 'status-paid',
  Unpaid: 'status-unpaid',
  Partial: 'status-open',
};

/**
 * @param {StatusBadgeProps} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const className = STATUS_CLASS[status] ?? 'status-open';
  return <span className={className}>{status}</span>;
}
