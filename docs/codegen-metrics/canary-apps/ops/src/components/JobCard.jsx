import StatusBadge from './StatusBadge.jsx'

/**
 * Card that summarizes one job. Clicking it reports the job id to the caller.
 *
 * @param {object} props
 * @param {{ id: string, title: string, owner: string, status: string, dueDate: string }} props.item - The job to display.
 * @param {(id: string) => void} props.onSelect - Called with item.id when the card is clicked.
 * @returns {JSX.Element}
 */
export default function JobCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <span>{item.title}</span>
      <span>{item.owner}</span>
      <span>{item.dueDate}</span>
      <StatusBadge status={item.status} />
    </button>
  )
}
