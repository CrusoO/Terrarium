import type { Produce } from '../types.ts'
export default function ProduceCard({ item, onSelect }: { item: Produce, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.name || item.id}</strong>
      <span><em>name</em> {String(item.name ?? '')}</span>
      <span><em>stall</em> {String(item.stall ?? '')}</span>
      <span><em>status</em> {String(item.status ?? '')}</span>
      <span><em>price</em> {String(item.price ?? '')}</span>
    </button>
  )
}
