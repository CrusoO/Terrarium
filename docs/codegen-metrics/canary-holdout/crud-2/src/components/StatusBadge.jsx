/**
 * Leaf badge that shows a student's attendance status.
 * Statuses in the data model are Present, Absent, and Late.
 * Classes for the scaffold stylesheet are used where they exist. Other values fall back to a neutral class.
 *
 * @typedef {Object} StatusBadgeProps
 * @property {string} status
 */

const STATUS_CLASS = {
  Paid: 'status-paid',
  Open: 'status-open',
  Unpaid: 'status-unpaid',
  Overdue: 'status-overdue',
};

/**
 * @param {StatusBadgeProps} props
 */
export default function StatusBadge({ status }) {
  const className = Object.prototype.hasOwnProperty.call(STATUS_CLASS, status)
    ? STATUS_CLASS[status]
    : 'status-badge';

  return <span className={className}>{status}</span>;
}
