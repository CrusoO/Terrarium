import type { Dog } from '../types.ts'
export default function DogCard({ item, onSelect }: { item: Dog, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.name || item.id}</strong>
      <span><em>name</em> {String(item.name ?? '')}</span>
      <span><em>kennel</em> {String(item.kennel ?? '')}</span>
      <span><em>status</em> {String(item.status ?? '')}</span>
      <span><em>owner</em> {String(item.owner ?? '')}</span>
    </button>
  )
}
