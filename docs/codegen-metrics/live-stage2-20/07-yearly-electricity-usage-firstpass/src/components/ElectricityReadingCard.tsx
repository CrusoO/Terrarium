import { useElectricityReadings } from '../hooks/useData.ts'

type ElectricityReading = ReturnType<typeof useElectricityReadings>[number]

type Props = {
  item: ElectricityReading
  onSelect: (id: string) => void
  onOpen?: (id: string) => void
  onDone?: () => void
}

export default function ElectricityReadingCard({ item, onSelect }: Props) {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      <div>
        <span>ID: </span>
        <span>{String(item.id ?? '')}</span>
      </div>
      <div>
        <span>Month: </span>
        <span>{String(item.month ?? '')}</span>
      </div>
      <div>
        <span>Usage: </span>
        <span>{String(item.usage ?? '')}</span>
      </div>
      <div>
        <span>Bill Amount: </span>
        <span>{String(item.billAmount ?? '')}</span>
      </div>
      <div>
        <span>Is Highest: </span>
        <span>{String(item.isHighest ?? '')}</span>
      </div>
    </button>
  )
}
