import type { Session } from '../types.ts'
export default function SessionCard({ item, onSelect }: { item: Session, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.name || item.id}</strong>
      <span><em>name</em> {String(item.name ?? '')}</span>
      <span><em>producer</em> {String(item.producer ?? '')}</span>
      <span><em>status</em> {String(item.status ?? '')}</span>
      <span><em>hours</em> {String(item.hours ?? '')}</span>
    </button>
  )
}
