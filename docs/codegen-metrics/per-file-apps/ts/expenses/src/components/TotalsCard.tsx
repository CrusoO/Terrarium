import type { DailyTotal } from '../types';

// Renders one card per DailyTotal row. Field names follow the scaffold DailyTotal type.
export default function TotalsCard({ totals }: { totals: DailyTotal[] }) {
  return (
    <div className="totals-grid">
      {totals.map((row, index) => (
        <div className="entity-card" key={`${row.date}-${index}`}>
          <div>{row.date}</div>
          <div>{row.total.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}
