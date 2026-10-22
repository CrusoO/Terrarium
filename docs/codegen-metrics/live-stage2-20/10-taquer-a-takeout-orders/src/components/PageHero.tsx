import { ShoppingBag } from 'lucide-react';

export default function PageHero() {
  return (
    <section className="page">
      <h2>
        <ShoppingBag aria-hidden="true" />
        {' '}
        {"Taquer\u00eda Takeout Orders"}
      </h2>
      <p>Track every Order from ticket to payment, all in one place.</p>
    </section>
  );
}
