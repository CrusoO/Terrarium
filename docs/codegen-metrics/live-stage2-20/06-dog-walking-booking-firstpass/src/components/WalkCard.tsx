interface WalkItem {
  id: string;
  date: string;
  time: string;
  duration: number;
  clientName: string;
  dogName: string;
  notes: string;
  status: string;
}

interface WalkCardProps {
  item: WalkItem;
  onSelect: (id: string) => void;
}

export default function WalkCard({ item, onSelect }: WalkCardProps) {
  return (
    <div className="entity-card" onClick={() => onSelect(item.id)}>
      <div className="entity-field">
        <span className="entity-label">id: </span>
        <span className="entity-value">{String(item.id ?? '')}</span>
      </div>
      <div className="entity-field">
        <span className="entity-label">date: </span>
        <span className="entity-value">{String(item.date ?? '')}</span>
      </div>
      <div className="entity-field">
        <span className="entity-label">time: </span>
        <span className="entity-value">{String(item.time ?? '')}</span>
      </div>
      <div className="entity-field">
        <span className="entity-label">duration: </span>
        <span className="entity-value">{String(item.duration ?? '')}</span>
      </div>
      <div className="entity-field">
        <span className="entity-label">clientName: </span>
        <span className="entity-value">{String(item.clientName ?? '')}</span>
      </div>
      <div className="entity-field">
        <span className="entity-label">dogName: </span>
        <span className="entity-value">{String(item.dogName ?? '')}</span>
      </div>
      <div className="entity-field">
        <span className="entity-label">notes: </span>
        <span className="entity-value">{String(item.notes ?? '')}</span>
      </div>
      <div className="entity-field">
        <span className="entity-label">status: </span>
        <span className="entity-value">{String(item.status ?? '')}</span>
      </div>
    </div>
  );
}
