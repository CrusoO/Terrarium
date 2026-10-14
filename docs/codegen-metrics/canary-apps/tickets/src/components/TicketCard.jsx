import StatusBadge from './StatusBadge.jsx'

/**
 * Card summarizing one Ticket. Selecting it reports the ticket id.
 *
 * @param {Object} props
 * @param {{ id: string, subject: string, requester: string, status: string, openedOn: string }} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export default function TicketCard({ item, onSelect }) {
  return (
    <button
      type="button"
      className="entity-card"
      onClick={() => onSelect(item.id)}
    >
      <div>
        <strong>{item.subject}</strong>
      </div>
      <div>{item.requester}</div>
      <div>{item.openedOn}</div>
      <StatusBadge status={item.status} />
    </button>
  )
}
