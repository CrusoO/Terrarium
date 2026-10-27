/**
 * Row of status filter tabs. Each tab is a button; the active status is marked with aria-pressed.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to render as tabs (for example Breakfast, Dinner, Snack).
 * @param {string} props.active - Currently selected status.
 * @param {(value: string) => void} props.onChange - Called with the clicked status string.
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={status === active}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
