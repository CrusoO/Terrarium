import type { ReturnType } from 'react'
import { useParts } from '../hooks/useData.ts'

type Part = ReturnType<typeof useParts>[number]

interface PartCardProps {
  item: Part
  onSelect: (id: string) => void
}

export default function PartCard({ item, onSelect }: PartCardProps) {
  const handleSelect = () => {
    onSelect(item.id)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect()
    }
  }

  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <div>
        <span>id: </span>
        <span>{String(item.id ?? '')}</span>
      </div>
      <div>
        <span>name: </span>
        <span>{String(item.name ?? '')}</span>
      </div>
      <div>
        <span>bin: </span>
        <span>{String(item.bin ?? '')}</span>
      </div>
      <div>
        <span>condition: </span>
        <span>{String(item.condition ?? '')}</span>
      </div>
      <div>
        <span>quantity: </span>
        <span>{String(item.quantity ?? '')}</span>
      </div>
    </div>
  )
}
