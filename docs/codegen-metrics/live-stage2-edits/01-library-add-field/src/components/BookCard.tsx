import type { useBooks } from '../hooks/useData.ts'

type Book = ReturnType<typeof useBooks>[number]

interface BookCardProps {
  item: Book
  onSelect: (id: string) => void
}

const FIELDS: Array<keyof Book> = ['id', 'title', 'borrower', 'status', 'due', 'isbn']

export default function BookCard({ item, onSelect }: BookCardProps) {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      {FIELDS.map((field) => (
        <div key={field}>
          <strong>{field}: </strong>
          <span>{String(item[field] ?? '')}</span>
        </div>
      ))}
    </button>
  )
}
