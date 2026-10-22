import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';
import pricingData from '../data/pricingData.js';

export default function Pricing() {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  const handleSelect = (tier) => {
    setSelected(tier.id);
    setConfirmed(null);
  };

  const handleJoin = (tier) => {
    setConfirmed(tier.id);
    setSelected(null);
  };

  return (
    <section className="pricing" id="pricing">
      <div className="pricing__header">
        <span className="section-eyebrow">Membership Plans</span>
        <h2 className="section-heading">Find your level of involvement</h2>
        <p className="pricing__subhead">
          All memberships are month-to-month with no long-term commitment.
          Cancel or upgrade any time.
        </p>
      </div>

      {/* Confirmation banner */}
      {confirmed && (
        <div className="pricing__confirmation">
          <Check size={20} />
          <span>
            You've selected the <strong>{pricingData.find(t => t.id === confirmed)?.name}</strong> membership!
            We'll be in touch shortly to complete your sign-up.
          </span>
          <button className="pricing__confirmation-close" onClick={() => setConfirmed(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="pricing__grid">
        {pricingData.map((tier) => (
          <div
            key={tier.id}
            className={`pricing-card ${tier.highlighted ? 'pricing-card--highlighted' : ''} ${selected === tier.id ? 'pricing-card--selected' : ''}`}
            onClick={() => handleSelect(tier)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSelect(tier)}
            aria-pressed={selected === tier.id}
          >
            {tier.highlighted && (
              <div className="pricing-card__badge">
                <Star size={12} fill="currentColor" /> Most Popular
              </div>
            )}

            <div className="pricing-card__header">
              <h3 className="pricing-card__name">{tier.name}</h3>
              <p className="pricing-card__tagline">{tier.tagline}</p>
              <div className="pricing-card__price">
                <span className="pricing-card__currency">$</span>
                <span className="pricing-card__amount">{tier.price}</span>
                <span className="pricing-card__period">/{tier.period}</span>
              </div>
            </div>

            <ul className="pricing-card__features">
              {tier.features.map((feature) => (
                <li key={feature}>
                  <Check size={16} strokeWidth={2.5} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`btn btn--full ${tier.highlighted ? 'btn--primary' : 'btn--outline'}`}
              onClick={(e) => { e.stopPropagation(); handleJoin(tier); }}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="pricing__note">
        Not sure which tier is right for you? Come to an open shop night — membership is free to try for your first visit.
      </p>
    </section>
  );
}
