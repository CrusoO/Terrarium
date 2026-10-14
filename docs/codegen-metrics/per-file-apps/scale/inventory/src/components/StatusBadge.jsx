/**
 * Displays a status value as a badge.
 *
 * The class name is derived from the status so the scaffold stylesheet
 * can color it. No styles are defined here.
 *
 * @param {Object} props
 * @param {string} props.status - The status text to display, for example "Ok", "Low", or "Out".
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status }) {
  const label = String(status ?? "");
  const modifier = label.toLowerCase();

  return (
    <span className={`status-${modifier}`}>
      {label}
    </span>
  );
}
