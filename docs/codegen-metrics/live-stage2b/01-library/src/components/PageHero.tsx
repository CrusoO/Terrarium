import { BookOpen } from 'lucide-react'

export default function PageHero() {
  return (
    <section className="page">
      <BookOpen aria-hidden="true" />
      <h2>Library checkout</h2>
      <p>Track every Book you lend out, keep it on the shelf, or place it on hold.</p>
    </section>
  )
}
