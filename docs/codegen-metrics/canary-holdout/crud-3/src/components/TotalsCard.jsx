export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div className="entity-card" key={row && row.date ? row.date : index}>
          {Object.entries(row || {}).map(([field, value]) => (
            <div key={field}>
              {field}: {String(value)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
