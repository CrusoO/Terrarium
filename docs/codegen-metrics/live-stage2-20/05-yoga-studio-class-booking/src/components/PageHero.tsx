import { useClassBookings, useSelectedClassBooking, useClassBookingActions } from '../hooks/useData.ts'
import { CalendarDays } from 'lucide-react'

export default function PageHero() {
  return (
    <section className="page">
      <CalendarDays aria-hidden="true" />
      <h2>Yoga Studio Class Booking</h2>
      <p>Browse and manage every ClassBooking in the studio schedule.</p>
    </section>
  )
}
