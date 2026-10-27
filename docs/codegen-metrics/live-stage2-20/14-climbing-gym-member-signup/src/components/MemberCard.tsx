import StatusBadge from './StatusBadge'

type Member = {
  id: string
  fullName: string
  email: string
  membershipMonths: number
  emergencyContactName: string
  emergencyContactPhone: string
  joinDate: string
  signupStatus: string
}

type MemberCardProps = {
  item: Member
  onSelect: (id: string) => void
}

export default function MemberCard({ item, onSelect }: MemberCardProps) {
  return (
    <div
      className="entity-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(item.id)
        }
      }}
    >
      <p>
        <strong>id: </strong>
        <span>{String(item.id ?? '')}</span>
      </p>
      <p>
        <strong>fullName: </strong>
        <span>{String(item.fullName ?? '')}</span>
      </p>
      <p>
        <strong>email: </strong>
        <span>{String(item.email ?? '')}</span>
      </p>
      <p>
        <strong>membershipMonths: </strong>
        <span>{String(item.membershipMonths ?? '')}</span>
      </p>
      <p>
        <strong>emergencyContactName: </strong>
        <span>{String(item.emergencyContactName ?? '')}</span>
      </p>
      <p>
        <strong>emergencyContactPhone: </strong>
        <span>{String(item.emergencyContactPhone ?? '')}</span>
      </p>
      <p>
        <strong>joinDate: </strong>
        <span>{String(item.joinDate ?? '')}</span>
      </p>
      <p>
        <strong>signupStatus: </strong>
        <StatusBadge status={String(item.signupStatus ?? '')} />
      </p>
    </div>
  )
}
