import { useSelectedElectricityReading } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedElectricityReading()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>ElectricityReading</p><h2>{item.month || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>month</strong> {String(item.month ?? '')}</p>
        <p><strong>usage</strong> {String(item.usage ?? '')}</p>
        <p><strong>billAmount</strong> {String(item.billAmount ?? '')}</p>
        <p><strong>isHighest</strong> {String(item.isHighest ?? '')}</p>
    </article>
  )
}
