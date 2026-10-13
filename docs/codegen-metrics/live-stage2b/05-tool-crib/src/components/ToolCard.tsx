import StatusBadge from './StatusBadge';

interface ToolCardItem {
  id: string;
  name: string;
  hook: string;
  status: string;
  borrower: string;
}

interface ToolCardProps {
  item: ToolCardItem;
  onSelect: (id: string) => void;
}

export default function ToolCard({ item, onSelect }: ToolCardProps) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div>
        <span className="field-label">id: </span>
        <span>{String(item.id ?? '')}</span>
      </div>
      <div>
        <span className="field-label">name: </span>
        <span>{String(item.name ?? '')}</span>
      </div>
      <div>
        <span className="field-label">hook: </span>
        <span>{String(item.hook ?? '')}</span>
      </div>
      <div>
        <span className="field-label">status: </span>
        <StatusBadge status={String(item.status ?? '')} />
      </div>
      <div>
        <span className="field-label">borrower: </span>
        <span>{String(item.borrower ?? '')}</span>
      </div>
    </button>
  );
}
