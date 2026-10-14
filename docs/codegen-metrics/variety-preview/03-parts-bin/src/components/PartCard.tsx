import type { Part } from '../types.ts'
export default function PartCard({ item, onSelect }: { item: Part, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.name || item.id}</strong>
      <span><em>name</em> {String(item.name ?? '')}</span>
      <span><em>bin</em> {String(item.bin ?? '')}</span>
      <span><em>condition</em> {String(item.condition ?? '')}</span>
      <span><em>qty</em> {String(item.qty ?? '')}</span>
    </button>
  )
}
