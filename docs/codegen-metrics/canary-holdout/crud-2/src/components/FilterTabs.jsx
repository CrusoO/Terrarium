import React from 'react'

/**
 * Row of filter tabs, one per status. Calls onChange with the status string.
 *
 * @param {{
 *   statuses: string[],
 *   active: string,
 *   onChange: (value: string) => void
 * }} props
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row" role="tablist">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          role="tab"
          aria-selected={status === active}
          className={status === active ? 'filter-tab active' : 'filter-tab'}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  )
}
