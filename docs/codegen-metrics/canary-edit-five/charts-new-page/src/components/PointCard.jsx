export default function PointCard({ item, onSelect }) {
  return <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>{item.label || item.id}</button>
}
