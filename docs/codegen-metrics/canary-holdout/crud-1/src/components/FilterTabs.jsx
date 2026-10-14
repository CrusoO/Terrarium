/**
 * Row of status filter tabs. Calls onChange with the status string, never an event.
 * @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props
 * @returns {JSX.Element}
 */
export default function FilterTabs({ statuses, active, onChange }) {
  return (
    <div className="filter-row" role="tablist">
      {(statuses ?? []).map((status) => (
        <button
          key={status}
          type="button"
          role="tab"
          aria-selected={active === status}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  )
}
