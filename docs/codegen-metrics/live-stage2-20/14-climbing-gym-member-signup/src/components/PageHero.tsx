import { Users } from 'lucide-react'

export default function PageHero() {
  return (
    <section className="page">
      <h2>
        <Users size={20} aria-hidden="true" /> Climbing Gym Member Signup
      </h2>
      <p>Register each new Member with contact details, then track the signup through completion.</p>
    </section>
  )
}
