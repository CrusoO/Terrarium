import { useSelectedVenueRequest } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedVenueRequest()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>VenueRequest</p><h2>{item.preferredDate || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>preferredDate</strong> {String(item.preferredDate ?? '')}</p>
        <p><strong>guestCount</strong> {String(item.guestCount ?? '')}</p>
        <p><strong>cateringStyle</strong> {String(item.cateringStyle ?? '')}</p>
        <p><strong>coupleEmail</strong> {String(item.coupleEmail ?? '')}</p>
        <p><strong>couplePhone</strong> {String(item.couplePhone ?? '')}</p>
        <p><strong>stage</strong> {String(item.stage ?? '')}</p>
    </article>
  )
}
