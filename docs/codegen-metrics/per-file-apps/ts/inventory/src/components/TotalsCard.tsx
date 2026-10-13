import type { DailyTotal } from '../types';

export interface TotalsCardProps {
  totals: DailyTotal[];
}

export default function TotalsCard({ totals }: TotalsCardProps) {
  return (
    <div className="totals-grid">
      {totals.length === 0 ? (
        <div className="entity-card">No totals yet</div>
      ) : (
        totals.map((t, index) => (
          <div className="entity-card" key={index}>
            {JSON.stringify(t)}
          </div>
        ))
      )}
    </div>
  );
}
