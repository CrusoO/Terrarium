/**
 * Status filter tabs. Leaf component: renders one button per status and reports the chosen value.
 * @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props
 */
export default function FilterTabs({ statuses = [], active, onChange }) {
  return (
    <div className="filter-row" role="group" aria-label="Filter by status">
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
