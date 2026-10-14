import React, { useState } from 'react';
import { pricingTiers } from '../data/studioData.js';
import { Check } from 'lucide-react';

export default function Pricing() {
  const [selected, setSelected] = useState(null);
  const [booked, setBooked] = useState(null);

  const handleBook = (tier) => {
    setBooked(tier.id);
    setTimeout(() => setBooked(null), 3000);
  };

  return (
    <section id="pricing" className="pricing">
      <div className="section-container">
        <div className="section-header">
          <span className="section-eyebrow">Transparent Pricing</span>
          <h2 className="section-title">Find Your Perfect Fit</h2>
          <p className="section-subtitle">
            No hidden fees. Every tier includes kiln firing, tools, and a warm welcome.
          </p>
        </div>

        <div className="pricing__grid">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`pricing-card${tier.badge ? ' pricing-card--featured' : ''}${selected === tier.id ? ' pricing-card--selected' : ''}`}
              onClick={() => setSelected(tier.id === selected ? null : tier.id)}
              role="button"
              tabIndex={0}
              aria-pressed={selected === tier.id}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(tier.id === selected ? null : tier.id)}
            >
              {tier.badge && (
                <span className="pricing-card__badge">{tier.badge}</span>
              )}

              <div className="pricing-card__header">
                <h3 className="pricing-card__name">{tier.name}</h3>
                <div className="pricing-card__price">
                  <span className="pricing-card__amount">${tier.price}</span>
                  <span className="pricing-card__unit">{tier.unit}</span>
                </div>
                <p className="pricing-card__desc">{tier.description}</p>
              </div>

              <ul className="pricing-card__features">
                {tier.features.map((f) => (
                  <li key={f} className="pricing-card__feature">
                    <Check size={16} className="pricing-card__check" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`btn btn--full${tier.badge ? ' btn--primary' : ' btn--outline'}`}
                onClick={(e) => { e.stopPropagation(); handleBook(tier); }}
              >
                {booked === tier.id ? '✓ Request Sent!' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="pricing__note">
          All sessions include access to our tool library, glazes, and kiln firing.
          Gift cards available — <a href="mailto:hello@clayandfire.studio" className="link">contact us</a>.
        </p>
      </div>
    </section>
  );
}
