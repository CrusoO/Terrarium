/**
 * StatusBadge: a leaf component that shows a status label with the scaffold's status colour class.
 * @param {{ status: string }} props
 */
export default function StatusBadge({ status }) {
  const statusClasses = {
    Paid: 'status-paid',
    Open: 'status-open',
    Unpaid: 'status-unpaid',
    Overdue: 'status-overdue',
  }

  return <span className={statusClasses[status]}>{status}</span>
}
