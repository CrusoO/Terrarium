import StatusBadge from './StatusBadge'

interface TailoringJobCardProps {
  item: {
    id: string
    garmentType: string
    dueDate: string
    hemStatus: string
    customerName: string
    notes: string
  }
  onSelect: (id: string) => void
}

export default function TailoringJobCard({ item, onSelect }: TailoringJobCardProps) {
  return (
    <div className="entity-card" onClick={() => onSelect(String(item.id ?? ''))}>
      <p>
        <strong>id:</strong> <span>{String(item.id ?? '')}</span>
      </p>
      <p>
        <strong>garmentType:</strong> <span>{String(item.garmentType ?? '')}</span>
      </p>
      <p>
        <strong>dueDate:</strong> <span>{String(item.dueDate ?? '')}</span>
      </p>
      <p>
        <strong>hemStatus:</strong> <StatusBadge status={String(item.hemStatus ?? '')} />
      </p>
      <p>
        <strong>customerName:</strong> <span>{String(item.customerName ?? '')}</span>
      </p>
      <p>
        <strong>notes:</strong> <span>{String(item.notes ?? '')}</span>
      </p>
    </div>
  )
}
