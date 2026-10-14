import { useSelectedDog } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedDog()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Dog</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>kennel</strong> {String(item.kennel ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>owner</strong> {String(item.owner ?? '')}</p>
    </article>
  )
}
