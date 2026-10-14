import { useSelectedPallet } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedPallet()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Pallet</p><h2>{item.code || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>code</strong> {String(item.code ?? '')}</p>
        <p><strong>aisle</strong> {String(item.aisle ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>weight</strong> {String(item.weight ?? '')}</p>
    </article>
  )
}
