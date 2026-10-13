import type { RecipeTest } from '../types.ts'
export default function RecipeTestCard({ item, onSelect }: { item: RecipeTest, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.dishName || item.id}</strong>
      <span><em>dishName</em> {String(item.dishName ?? '')}</span>
      <span><em>dateTried</em> {String(item.dateTried ?? '')}</span>
      <span><em>score</em> {String(item.score ?? '')}</span>
      <span><em>notes</em> {String(item.notes ?? '')}</span>
    </button>
  )
}
