/**
 * Leaf badge that displays an entity status (Ok, Low, Out).
 * The class name is derived from the status so the scaffold stylesheet can style each tone.
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const label = String(status ?? '')
  const tone = label.toLowerCase()
  return <span className={`status-${tone}`}>{label}</span>
}
