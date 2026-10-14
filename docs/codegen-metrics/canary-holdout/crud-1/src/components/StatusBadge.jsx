/**
 * Leaf badge that shows a payment status with the scaffold's status class.
 *
 * @typedef {object} StatusBadgeProps
 * @property {string} status - One of Paid, Unpaid, Partial.
 */

/**
 * Maps each payment status to a scaffold status class.
 * Partial has no dedicated class in the scaffold stylesheet, so it reuses status-open.
 * @type {Record<string, string>}
 */
const STATUS_CLASS = {
  Paid: 'status-paid',
  Unpaid: 'status-unpaid',
  Partial: 'status-open',
};

/**
 * @param {StatusBadgeProps} props
 */
export default function StatusBadge({ status }) {
  const className = STATUS_CLASS[status] ?? '';

  return <span className={className}>{status}</span>;
}
