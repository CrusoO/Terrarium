import { CalendarDays } from 'lucide-react'

export default function PageHero() {
  return (
    <section className="page">
      <h2>
        <CalendarDays aria-hidden="true" /> Appointment Manager
      </h2>
      <p>Browse, search, and manage every Appointment in one place.</p>
    </section>
  )
}
