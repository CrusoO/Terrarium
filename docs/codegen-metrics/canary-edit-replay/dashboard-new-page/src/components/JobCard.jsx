export default function JobCard({ item, onSelect }) {
  return <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>{item.title || item.id}</button>
}
