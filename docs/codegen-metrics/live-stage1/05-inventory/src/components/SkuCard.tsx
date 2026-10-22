import { useSkus } from '../hooks/useData.ts'
import StatusBadge from './StatusBadge.tsx'

type Sku = ReturnType<typeof useSkus>[number]

export default function SkuCard({
  item,
  onSelect,
}: {
  item: Sku
  onSelect: (id: string) => void
}) {
  return (
    <div className="entity-card" onClick={() => onSelect(item.id)}>
      <h3>{item.name}</h3>
      <p>{item.aisle}</p>
      <p>On hand: {item.onHand}</p>
      <StatusBadge status={item.status} />
    </div>
  )
}
