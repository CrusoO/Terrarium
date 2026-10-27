import type { Plant } from '../hooks/useData.ts'

interface PlantCardProps {
  item: Plant
  onSelect: (id: string) => void
}

const FIELDS: (keyof Plant)[] = ['id', 'name', 'bed', 'status', 'watered']

export default function PlantCard({ item, onSelect }: PlantCardProps) {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      {FIELDS.map((field) => (
        <span key={field} className="entity-row">
          <span className="field-label">{field}</span>{' '}
          <span className="field-value">{String(item[field] ?? '')}</span>
        </span>
      ))}
    </button>
  )
}
