import { BarChart3 } from 'lucide-react'

export default function PageHero() {
  return (
    <section className="page">
      <h2>
        <BarChart3 size={20} aria-hidden="true" /> Monthly Sales Dashboard
      </h2>
      <p>Review each Sale by month, year, total, and transaction count.</p>
    </section>
  )
}
