export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((row, index) => {
        const label = row?.date ?? row?.pickupDate ?? `Day ${index + 1}`;
        const value = row?.total ?? row?.count ?? 0;
        return (
          <div className="entity-card" key={`${label}-${index}`}>
            <span>{String(label)}</span>
            <strong>{String(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}
