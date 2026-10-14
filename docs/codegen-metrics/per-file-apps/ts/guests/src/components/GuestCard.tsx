import type { Guest } from '../types';

export default function GuestCard({ item, onSelect }: { item: Guest; onSelect: (id: string) => void }) {
  return (
    <button type="button" className="entity-card" onClick={() => onSelect(item.id)}>
      <span className="guest-name">{item.name}</span>
      <span className="guest-party">{item.party}</span>
      <span className="guest-status">{item.status}</span>
      <span className="guest-seats">{item.seats}</span>
    </button>
  );
}
