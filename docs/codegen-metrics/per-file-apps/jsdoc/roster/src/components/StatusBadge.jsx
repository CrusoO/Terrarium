import React from 'react';

/**
 * Class names owned by the scaffold stylesheet, keyed by status value.
 * Statuses without an entry render without a status-specific class.
 * @type {Record<string, string>}
 */
const STATUS_CLASS_NAMES = {
  Paid: 'status-paid',
  Open: 'status-open',
  Unpaid: 'status-unpaid',
  Overdue: 'status-overdue',
};

/**
 * Leaf component that displays a single status label.
 *
 * @param {Object} props
 * @param {string} props.status - The status text to display (e.g. "Present", "Absent", "Late").
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const className = STATUS_CLASS_NAMES[status] ?? '';

  return <span className={className || undefined}>{status}</span>;
}
