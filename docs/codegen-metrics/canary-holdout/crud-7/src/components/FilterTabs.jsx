/**
 * Row of filter buttons, one per status value.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to render as tabs.
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the clicked status string.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses = [], active, onChange }) {
  return (
    <div className="filter-row">
      {statuses.map((status) => {
        const isActive = status === active
        return (
          <button
            key={status}
            type="button"
            className={isActive ? 'active' : ''}
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
