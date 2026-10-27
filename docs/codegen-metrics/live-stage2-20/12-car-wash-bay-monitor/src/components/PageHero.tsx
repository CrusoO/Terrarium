import { Car } from 'lucide-react'

export default function PageHero() {
  return (
    <section className="page">
      <Car aria-hidden="true" />
      <h2>Car Wash Bay Monitor</h2>
      <p>Track every Bay, its current vehicle, and today's washes at a glance.</p>
    </section>
  )
}
