export default function LeadCard({ item, onSelect }) {
  return <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>{item.name || item.id}</button>
}
