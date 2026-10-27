import type { Book } from '../types.ts'
export default function BookCard({ item, onSelect }: { item: Book, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.title || item.id}</strong>
      <span><em>title</em> {String(item.title ?? '')}</span>
      <span><em>borrower</em> {String(item.borrower ?? '')}</span>
      <span><em>status</em> {String(item.status ?? '')}</span>
      <span><em>due</em> {String(item.due ?? '')}</span>
    </button>
  )
}
