/**
 * FilterTabs renders a row of status filter buttons.
 * @param {{statuses: string[], active: string, onChange: (value: string) => void}} props
 */
export default function FilterTabs({ statuses = [], active, onChange }) {
  return (
    <div className="filter-row">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          className={status === active ? 'active' : ''}
          aria-pressed={status === active}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  )
}
