export default function VisitCard({ item, onSelect }) {
  return <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>{item.client || item.id}</button>
}
