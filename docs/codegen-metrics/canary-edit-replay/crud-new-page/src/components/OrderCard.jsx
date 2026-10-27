export default function OrderCard({ item, onSelect }) {
  return <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>{item.customer || item.id}</button>
}
