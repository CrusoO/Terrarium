import React from 'react'

/**
 * Row of status filter tabs.
 * @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  const list = Array.isArray(statuses) ? statuses : []

  return (
    <div className="filter-row" role="group" aria-label="Filter by status">
      {list.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={status === active}
          className={status === active ? 'filter-tab filter-tab-active' : 'filter-tab'}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  )
}
