/**
 * StatusBadge: leaf component that shows a visit status as a labelled badge.
 * Accepts Booked, Done, Cancelled, and the legacy example value "Paid".
 * Styling comes from the scaffold stylesheet, so this file imports no CSS.
 */

/** @type {Record<string, string>} */
const STATUS_CLASS = {
  Booked: "status-open",
  Done: "status-paid",
  Paid: "status-paid",
  Cancelled: "status-overdue",
  Unpaid: "status-unpaid",
  Overdue: "status-overdue",
};

/**
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const modifier = STATUS_CLASS[status] ?? "";
  const className = modifier ? `status-badge ${modifier}` : "status-badge";

  return <span className={className}>{status}</span>;
}
