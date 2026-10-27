import type { ReactElement } from 'react'
import { useBatchs } from '../hooks/useData.ts'
import StatusBadge from './StatusBadge'

type Batch = ReturnType<typeof useBatchs>[number]

export default function BatchCard({
  item,
  onSelect,
}: {
  item: Batch
  onSelect: (id: string) => void
}): ReactElement {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      <div>
        <span>id: </span>
        <span>{String(item.id ?? '')}</span>
      </div>
      <div>
        <span>name: </span>
        <span>{String(item.name ?? '')}</span>
      </div>
      <div>
        <span>baker: </span>
        <span>{String(item.baker ?? '')}</span>
      </div>
      <div>
        <span>status: </span>
        <StatusBadge status={String(item.status ?? '')} />
      </div>
      <div>
        <span>due: </span>
        <span>{String(item.due ?? '')}</span>
      </div>
    </button>
  )
}
