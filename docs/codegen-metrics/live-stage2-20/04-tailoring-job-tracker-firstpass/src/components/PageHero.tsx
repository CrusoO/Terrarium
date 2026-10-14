import { Scissors } from 'lucide-react'

export default function PageHero() {
  return (
    <section className="page">
      <h2>
        <Scissors size={20} aria-hidden="true" /> Tailoring Job Tracker
      </h2>
      <p>Track every TailoringJob from fitting to delivery.</p>
    </section>
  )
}
