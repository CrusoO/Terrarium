import type { ReactElement } from 'react'
import { Wheat } from 'lucide-react'

export default function PageHero(): ReactElement {
  return (
    <section>
      <Wheat aria-hidden="true" />
      <h2>Bakery board</h2>
      <p>Follow each Batch from proofing to baked and keep every loaf on time.</p>
    </section>
  )
}
