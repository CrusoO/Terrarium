export default function TotalsCard({ totals }) {
  const rows = Array.isArray(totals) ? totals : [];

  return (
    <div className="totals-grid">
      {rows.map((row, index) => (
        <div key={index}>
          {Object.entries(row ?? {}).map(([field, value]) => (
            <p key={field}>
              <strong>{field}: </strong>
              <span>{typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}</span>
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
