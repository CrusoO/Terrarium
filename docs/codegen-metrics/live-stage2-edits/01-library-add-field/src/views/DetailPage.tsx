import { useSelectedBook } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedBook()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Book</p><h2>{item.title || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>title</strong> {String(item.title ?? '')}</p>
        <p><strong>borrower</strong> {String(item.borrower ?? '')}</p>
        <p><strong>status</strong> {String(item.status ?? '')}</p>
        <p><strong>due</strong> {String(item.due ?? '')}</p>
        <p><strong>isbn</strong> {String(item.isbn ?? '')}</p>
    </article>
  )
}
