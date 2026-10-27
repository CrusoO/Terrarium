/**
 * Badge that displays a payment status with the matching scaffold class.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const classByStatus = {
    Paid: 'status-paid',
    Unpaid: 'status-unpaid',
    Partial: 'status-open',
  };
  const className = classByStatus[status] || '';

  return <span className={className}>{status}</span>;
}
