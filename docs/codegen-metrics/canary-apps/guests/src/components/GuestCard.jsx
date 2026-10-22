import StatusBadge from './StatusBadge.jsx'

/**
 * @typedef {Object} Guest
 * @property {string} id
 * @property {string} name
 * @property {string} party
 * @property {string} status
 * @property {number} seats
 */

/**
 * Card for a single guest. Clicking or pressing Enter selects the guest by id.
 *
 * @param {Object} props
 * @param {Guest} props.item
 * @param {(id: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export default function GuestCard({ item, onSelect }) {
  const handleActivate = () => {
    onSelect(item.id)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleActivate()
    }
  }

  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <div className="guest-name">{item.name}</div>
      <div className="guest-party">{item.party}</div>
      <div className="guest-seats">Seats: {item.seats}</div>
      <StatusBadge status={item.status} />
    </div>
  )
}
