import type { useBooks } from '../hooks/useData.ts'
import StatusBadge from './StatusBadge'

type Book = ReturnType<typeof useBooks>[number]

type BookCardProps = {
  item: Book
  onSelect: (id: string) => void
}

export default function BookCard({ item, onSelect }: BookCardProps) {
  return (
    <div className="entity-card" onClick={() => onSelect(item.id)}>
      <div>
        <span className="label">id: </span>
        <span>{String(item.id ?? '')}</span>
      </div>
      <div>
        <span className="label">title: </span>
        <span>{String(item.title ?? '')}</span>
      </div>
      <div>
        <span className="label">borrower: </span>
        <span>{String(item.borrower ?? '')}</span>
      </div>
      <div>
        <span className="label">status: </span>
        <StatusBadge status={String(item.status ?? '')} />
      </div>
      <div>
        <span className="label">due: </span>
        <span>{String(item.due ?? '')}</span>
      </div>
    </div>
  )
}
