import type { Supply } from '../types.ts'
export default function SupplyCard({ item, onSelect }: { item: Supply, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.name || item.id}</strong>
      <span><em>name</em> {String(item.name ?? '')}</span>
      <span><em>cabinet</em> {String(item.cabinet ?? '')}</span>
      <span><em>status</em> {String(item.status ?? '')}</span>
      <span><em>count</em> {String(item.count ?? '')}</span>
    </button>
  )
}
