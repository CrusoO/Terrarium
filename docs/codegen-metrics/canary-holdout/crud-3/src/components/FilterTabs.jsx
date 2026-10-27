/**
 * Row of filter tabs, one per status value.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to render as tabs.
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the chosen status string.
 */
export default function FilterTabs({ statuses, active, onChange }) {
  const list = Array.isArray(statuses) ? statuses : []

  return (
    <div className="filter-row" role="tablist">
      {list.map((status) => {
        const isActive = status === active
        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-pressed={isActive}
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        )
      })}
    </div>
  )
}
