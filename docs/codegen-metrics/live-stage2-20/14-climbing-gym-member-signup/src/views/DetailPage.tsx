import { useSelectedMember } from '../hooks/useData.ts'
export default function DetailPage() {
  const item = useSelectedMember()
  if (!item) return <p>Select an item.</p>
  return (
    <article className="page"><p>Member</p><h2>{item.fullName || item.id}</h2>
        <p><strong>id</strong> {String(item.id ?? '')}</p>
        <p><strong>fullName</strong> {String(item.fullName ?? '')}</p>
        <p><strong>email</strong> {String(item.email ?? '')}</p>
        <p><strong>membershipMonths</strong> {String(item.membershipMonths ?? '')}</p>
        <p><strong>emergencyContactName</strong> {String(item.emergencyContactName ?? '')}</p>
        <p><strong>emergencyContactPhone</strong> {String(item.emergencyContactPhone ?? '')}</p>
        <p><strong>joinDate</strong> {String(item.joinDate ?? '')}</p>
        <p><strong>signupStatus</strong> {String(item.signupStatus ?? '')}</p>
    </article>
  )
}
