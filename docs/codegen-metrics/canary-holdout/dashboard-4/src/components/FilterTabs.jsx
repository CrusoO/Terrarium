/**
 * Row of status filter buttons. Calls onChange with the status string, never an event.
 * @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props
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
