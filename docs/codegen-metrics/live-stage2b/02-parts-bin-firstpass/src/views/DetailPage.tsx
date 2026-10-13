import { useSelectedPart } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedPart()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Part</p><h2>{item.name || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>name</strong> {String(item.name ?? '')}</p>
        <p><strong>bin</strong> {String(item.bin ?? '')}</p>
        <p><strong>condition</strong> {String(item.condition ?? '')}</p>
        <p><strong>qty</strong> {String(item.qty ?? '')}</p>
    </article>
  )
}
