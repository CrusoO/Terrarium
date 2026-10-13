import type { Van } from '../types.ts'
export default function VanCard({ item, onSelect }: { item: Van, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.name || item.id}</strong>
      <span><em>name</em> {String(item.name ?? '')}</span>
      <span><em>route</em> {String(item.route ?? '')}</span>
      <span><em>status</em> {String(item.status ?? '')}</span>
      <span><em>miles</em> {String(item.miles ?? '')}</span>
    </button>
  )
}
