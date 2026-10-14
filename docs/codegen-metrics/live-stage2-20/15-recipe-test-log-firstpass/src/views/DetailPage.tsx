import { useSelectedRecipeTest } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedRecipeTest()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>RecipeTest</p><h2>{item.dishName || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>dishName</strong> {String(item.dishName ?? '')}</p>
        <p><strong>dateTried</strong> {String(item.dateTried ?? '')}</p>
        <p><strong>score</strong> {String(item.score ?? '')}</p>
        <p><strong>notes</strong> {String(item.notes ?? '')}</p>
    </article>
  )
}
