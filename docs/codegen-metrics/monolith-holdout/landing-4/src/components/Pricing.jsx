import React, { useState } from 'react';
import { pricingTiers } from '../data/content.js';

export default function Pricing() {
  const [selected, setSelected] = useState(null);

  const handleBook = (e, tierName) => {
    e.stopPropagation();
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="section pricing" id="pricing">
      <div className="container">
        <div className="section__header">
          <span className="section__eyebrow">Transparent Pricing</span>
          <h2 className="section__title">Simple, Honest Rates</h2>
          <p className="section__subtitle">
            No hidden fees. No surprises. Just great walks at fair prices.
          </p>
        </div>

        <div className="pricing__grid">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`pricing-card ${tier.featured ? 'pricing-card--featured' : ''} ${selected === tier.id ? 'pricing-card--selected' : ''}`}
              onClick={() => setSelected(selected === tier.id ? null : tier.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(selected === tier.id ? null : tier.id)}
            >
              {tier.featured && <div className="pricing-card__ribbon">Most Popular</div>}
              <div className="pricing-card__header">
                <h3 className="pricing-card__name">{tier.name}</h3>
                <p className="pricing-card__desc">{tier.description}</p>
                <div className="pricing-card__price">
                  <span className="pricing-card__currency">$</span>
                  <span className="pricing-card__amount">{tier.price}</span>
                  <span className="pricing-card__unit">/{tier.unit.replace('per ', '')}</span>
                </div>
              </div>
              <ul className="pricing-card__features">
                {tier.features.map((feature, i) => (
                  <li key={i} className="pricing-card__feature">
                    <span className="pricing-card__check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`btn btn--lg ${tier.featured ? 'btn--primary' : 'btn--outline'}`}
                onClick={(e) => handleBook(e, tier.name)}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="pricing__note">
          🐾 First walk is always a free meet & greet. All prices include GPS tracking and photo updates.
        </p>
      </div>
    </section>
  );
}
