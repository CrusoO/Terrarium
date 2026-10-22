/** @param {{ statuses: string[], active: string, onChange: (value: string) => void }} props */
export default function FilterTabs({ statuses, active, onChange }) {
  return <div className="filter-row">{(statuses || []).map((status) => <button type="button" key={status} onClick={() => onChange(status)}>{status}</button>)}</div>
}
