import type { ReactElement } from 'react'
import StatusBadge from './StatusBadge'

export interface StudentCardItem {
  id: string
  name: string
  homeroom: string
  status: string
  guardian: string
}

export interface StudentCardProps {
  item: StudentCardItem
  onSelect: (id: string) => void
}

export default function StudentCard({ item, onSelect }: StudentCardProps): ReactElement {
  return (
    <div className="entity-card" onClick={() => onSelect(String(item.id ?? ''))}>
      <h3>{String(item.name ?? '')}</h3>
      <p>Homeroom: {String(item.homeroom ?? '')}</p>
      <p>Guardian: {String(item.guardian ?? '')}</p>
      <StatusBadge status={String(item.status ?? '')} />
    </div>
  )
}
