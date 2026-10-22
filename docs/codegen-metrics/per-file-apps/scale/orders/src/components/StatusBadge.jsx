/**
 * Shows a payment status as a badge. Colour comes from the scaffold stylesheet classes.
 * Partial uses status-open, since the scaffold defines no separate partial class.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
const STATUS_CLASS = {
  Paid: 'status-paid',
  Unpaid: 'status-unpaid',
  Partial: 'status-open',
};

export default function StatusBadge({ status }) {
  const modifier = STATUS_CLASS[status] ?? 'status-open';

  return <span className={`status-badge ${modifier}`}>{status}</span>;
}
