import { useSelectedPlant } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedPlant()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Plant</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>bed</strong> {String(item.bed ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>watered</strong> {String(item.watered ?? '')}</p>
    </article>
  )
}
