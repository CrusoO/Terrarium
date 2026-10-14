import { useSelectedSale } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedSale()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Sale</p><h2>{item.month || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>month</strong> {String(item.month ?? '')}</p>
        <p><strong>total</strong> {String(item.total ?? '')}</p>
        <p><strong>year</strong> {String(item.year ?? '')}</p>
        <p><strong>transactionCount</strong> {String(item.transactionCount ?? '')}</p>
        <p><strong>averageOrderValue</strong> {String(item.averageOrderValue ?? '')}</p>
    </article>
  )
}
