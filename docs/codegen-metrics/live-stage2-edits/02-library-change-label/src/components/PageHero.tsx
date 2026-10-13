import { BookOpen } from 'lucide-react'
import { useBooks } from '../hooks/useData.ts'

export interface PageHeroProps {
  onOpen?: (id: string) => void
  onDone?: () => void
}

export default function PageHero(_props: PageHeroProps = {}) {
  const books = useBooks()

  return (
    <section className="page">
      <BookOpen aria-hidden="true" />
      <h2>Loans desk</h2>
      <p>
        Track every Book on loan, on the shelf, or on hold. {books.length} Book
        {books.length === 1 ? '' : 's'} in the collection.
      </p>
    </section>
  )
}
