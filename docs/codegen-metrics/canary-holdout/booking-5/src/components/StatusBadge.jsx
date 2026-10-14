/**
 * Status badge for an order's paymentStatus value.
 * Styling comes from the scaffold stylesheet classes; no style block here.
 * @param {{ status: string }} props
 * @param {string} props.status - One of "Paid", "Unpaid", "Partial".
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const classByStatus = {
    Paid: 'status-paid',
    Unpaid: 'status-unpaid',
    Partial: 'status-open',
  }
  const className = classByStatus[status] ?? 'status-open'

  return <span className={className}>{status}</span>
}
