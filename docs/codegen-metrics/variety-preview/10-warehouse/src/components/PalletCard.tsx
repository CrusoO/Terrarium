import type { Pallet } from '../types.ts'
export default function PalletCard({ item, onSelect }: { item: Pallet, onSelect: (id: string) => void }) {
  return (
    <button className="entity-card" onClick={() => onSelect && onSelect(item.id)}>
      <strong>{item.code || item.id}</strong>
      <span><em>code</em> {String(item.code ?? '')}</span>
      <span><em>aisle</em> {String(item.aisle ?? '')}</span>
      <span><em>status</em> {String(item.status ?? '')}</span>
      <span><em>weight</em> {String(item.weight ?? '')}</span>
    </button>
  )
}
