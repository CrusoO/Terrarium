import type { DailyTotal } from "../types";

export default function TotalsCard({ totals }: { totals: DailyTotal[] }) {
  return (
    <div className="totals-grid">
      {totals.map((total, index) => (
        <div key={index} className="entity-card">
          {Object.entries(total).map(([label, value]) => (
            <p key={label}>
              <strong>{label}: </strong>
              {String(value)}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
