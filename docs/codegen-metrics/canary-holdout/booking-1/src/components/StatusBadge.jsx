/**
 * StatusBadge: shows a payment status as a styled badge.
 * Class names come from the scaffold stylesheet. This file emits no style block.
 * @param {{ status: string }} props
 */
export default function StatusBadge({ status }) {
  const variants = {
    Paid: 'status-paid',
    Unpaid: 'status-unpaid',
    Partial: 'status-open',
  }
  const variant = variants[status] ?? 'status-open'

  return <span className={variant}>{status}</span>
}
