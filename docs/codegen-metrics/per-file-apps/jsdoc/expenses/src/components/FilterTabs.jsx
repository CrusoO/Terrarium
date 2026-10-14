/**
 * Leaf component that renders one button per status value and reports the chosen one.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Status values to render as tabs.
 * @param {string} props.active - The currently active status.
 * @param {(value: string) => void} props.onChange - Called with the selected status string.
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
