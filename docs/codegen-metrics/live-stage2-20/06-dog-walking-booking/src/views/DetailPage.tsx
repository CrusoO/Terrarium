import { useSelectedWalk } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedWalk()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Walk</p><h2>{item.date || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>date</strong> {String(item.date ?? '')}</p>
        <p><strong>time</strong> {String(item.time ?? '')}</p>
        <p><strong>duration</strong> {String(item.duration ?? '')}</p>
        <p><strong>clientName</strong> {String(item.clientName ?? '')}</p>
        <p><strong>dogName</strong> {String(item.dogName ?? '')}</p>
        <p><strong>notes</strong> {String(item.notes ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
    </article>
  )
}
