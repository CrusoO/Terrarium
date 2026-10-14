export default function PartCard({
  item,
  onSelect,
}: {
  item: { id: string; name: string; bin: string; condition: string; qty: number }
  onSelect: (id: string) => void
}) {
  return (
    <div className="entity-card" onClick={() => onSelect(item.id)}>
      <p>
        <span>ID: </span>
        <span>{String(item.id ?? '')}</span>
      </p>
      <p>
        <span>Name: </span>
        <span>{String(item.name ?? '')}</span>
      </p>
      <p>
        <span>Bin: </span>
        <span>{String(item.bin ?? '')}</span>
      </p>
      <p>
        <span>Condition: </span>
        <span>{String(item.condition ?? '')}</span>
      </p>
      <p>
        <span>Qty: </span>
        <span>{String(item.qty ?? '')}</span>
      </p>
    </div>
  )
}
