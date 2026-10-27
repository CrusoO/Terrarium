import type { Volunteer } from '../types.ts'
export default function VolunteerCard({ item, onSelect }: { item: Volunteer, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.name || item.id}</strong>
      <span><em>name</em> {String(item.name ?? '')}</span>
      <span><em>role</em> {String(item.role ?? '')}</span>
      <span><em>status</em> {String(item.status ?? '')}</span>
      <span><em>shift</em> {String(item.shift ?? '')}</span>
    </button>
  )
}
