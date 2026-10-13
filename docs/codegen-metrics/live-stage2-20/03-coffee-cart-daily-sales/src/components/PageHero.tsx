import type { ReactElement } from 'react'
import { Coffee } from 'lucide-react'

export default function PageHero(): ReactElement {
  return (
    <section className="page">
      <h2>
        <Coffee aria-hidden="true" /> Coffee Cart Daily Sales
      </h2>
      <p>Review, search, and record every Sale from today&apos;s coffee cart.</p>
    </section>
  )
}
