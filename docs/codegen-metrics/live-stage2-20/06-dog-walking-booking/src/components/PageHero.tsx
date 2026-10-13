import { Dog } from 'lucide-react';

export default function PageHero() {
  return (
    <section className="page">
      <h2>
        <Dog size={20} aria-hidden="true" /> Dog Walking Booking
      </h2>
      <p>Browse, book, and manage every Walk in one place.</p>
    </section>
  );
}
