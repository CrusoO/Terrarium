import React from 'react'

/**
 * Small badge showing an entity status.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const label = String(status ?? '')
  const modifier = label.toLowerCase()
  return (
    <span className={`status-badge status-${modifier}`}>{label}</span>
  )
}
