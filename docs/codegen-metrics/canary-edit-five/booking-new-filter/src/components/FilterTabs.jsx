export default function FilterTabs({ statuses, active, onChange }) {
  return <div className="filter-row">{(statuses || []).map((status) => <button key={status} onClick={() => onChange(status)}>{status}</button>)}</div>
}
