/**
 * Row of filter buttons for choosing one status at a time.
 *
 * @param {object} props
 * @param {string[]} props.statuses Status values to show as tabs.
 * @param {string} props.active The currently selected status.
 * @param {(value: string) => void} props.onChange Called with the clicked status string.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={active === status}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  )
}
