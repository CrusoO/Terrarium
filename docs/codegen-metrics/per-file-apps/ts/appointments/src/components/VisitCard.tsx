import type { Visit } from '../types';
import StatusBadge from './StatusBadge';

interface VisitCardProps {
  item: Visit;
  onSelect: (id: string) => void;
}

export default function VisitCard({ item, onSelect }: VisitCardProps) {
  const handleClick = () => {
    onSelect(item.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="entity-card-header">
        <span className="entity-card-id">{item.id}</span>
        <StatusBadge status={item.status} />
      </div>
      <div className="entity-card-client">{item.client}</div>
      <div className="entity-card-service">{item.service}</div>
      <div className="entity-card-when">{item.when}</div>
    </div>
  );
}
