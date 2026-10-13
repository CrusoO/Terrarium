import type { RecipeTest } from '../types/index.ts'

type RecipeTestCardProps = {
  item: RecipeTest
  onSelect: (id: string) => void
}

export default function RecipeTestCard({ item, onSelect }: RecipeTestCardProps) {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      <span>
        <span className="label">id: </span>
        <span className="value">{String(item.id ?? '')}</span>
      </span>
      <span>
        <span className="label">dishName: </span>
        <span className="value">{String(item.dishName ?? '')}</span>
      </span>
      <span>
        <span className="label">dateTried: </span>
        <span className="value">{String(item.dateTried ?? '')}</span>
      </span>
      <span>
        <span className="label">score: </span>
        <span className="value">{String(item.score ?? '')}</span>
      </span>
      <span>
        <span className="label">notes: </span>
        <span className="value">{String(item.notes ?? '')}</span>
      </span>
    </button>
  )
}
