/**
 * Row of toggle buttons for choosing one payment status to filter by.
 * @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row" role="group" aria-label="Filter by payment status">
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
