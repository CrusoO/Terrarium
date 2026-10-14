import { CalendarDays } from 'lucide-react'

export default function PageHero() {
  return (
    <section className="page">
      <CalendarDays aria-hidden="true" />
      <h2>Tennis Court Reservations</h2>
      <p>Browse, book, and manage every court Reservation in one place.</p>
    </section>
  )
}
