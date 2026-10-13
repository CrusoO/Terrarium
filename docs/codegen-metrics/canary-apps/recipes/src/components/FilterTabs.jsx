/**
 * Tab row for filtering recipes by course.
 *
 * @param {Object} props
 * @param {string[]} props.statuses - Course values to show as tabs (Breakfast, Dinner, Snack).
 * @param {string} props.active - Currently selected course value.
 * @param {(value: string) => void} props.onChange - Called with the chosen course string.
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
  )
}
