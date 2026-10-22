import { Zap } from 'lucide-react'

export default function PageHero() {
  return (
    <section className="page">
      <Zap aria-hidden="true" />
      <h2>Yearly Electricity Usage</h2>
      <p>Review each monthly ElectricityReading, its usage, and its bill.</p>
    </section>
  )
}
