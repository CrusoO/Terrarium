import { Wrench } from 'lucide-react';

export default function PageHero() {
  return (
    <section className="page">
      <h2>
        <Wrench aria-hidden="true" /> Tool crib
      </h2>
      <p>Track each Tool, its hook location, its status, and who has it.</p>
    </section>
  );
}
