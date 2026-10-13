import type { Batch } from '../types.ts'
export default function BatchCard({ item, onSelect }: { item: Batch, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.name || item.id}</strong>
      <span><em>name</em> {String(item.name ?? '')}</span>
      <span><em>baker</em> {String(item.baker ?? '')}</span>
      <span><em>status</em> {String(item.status ?? '')}</span>
      <span><em>due</em> {String(item.due ?? '')}</span>
    </button>
  )
}
