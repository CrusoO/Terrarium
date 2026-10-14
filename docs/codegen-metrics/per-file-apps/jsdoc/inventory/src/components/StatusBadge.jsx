/**
 * StatusBadge
 * Leaf component that renders a status label with a scaffold-owned status class.
 * Accepts the Sku status values (Ok, Low, Out) as well as any other label passed in.
 *
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const label = typeof status === "string" ? status : "";
  const modifier = label.trim().toLowerCase().replace(/\s+/g, "-");

  return <span className={`status-${modifier}`}>{label}</span>;
}
