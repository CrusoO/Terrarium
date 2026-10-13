/**
 * FilterTabs: a row of status filter buttons.
 * Leaf component. Calls onChange with the status string, never an event.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to offer as tabs.
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the chosen status string.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  const items = Array.isArray(statuses) ? statuses : []

  return (
    <div className="filter-row" role="tablist">
      {items.map((status) => {
        const isActive = status === active
        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-pressed={isActive}
            className={isActive ? 'filter-tab active' : 'filter-tab'}
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        )
      })}
    </div>
  )
}
