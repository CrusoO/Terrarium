import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { pricingTiers } from '../data/plants.js';

export default function Pricing() {
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'
  const [selected, setSelected] = useState(null);

  const discount = 0.17; // 17% off annual

  const getPrice = (base) =>
    billing === 'annual' ? Math.round(base * (1 - discount)) : base;

  return (
    <section id="pricing" className="pricing">
      <div className="pricing__inner">
        {/* Header */}
        <div className="pricing__header">
          <span className="section-eyebrow">Subscription Plans</span>
          <h2 className="pricing__title">Find your perfect plan</h2>
          <p className="pricing__subtitle">
            Every plan includes free delivery, hand-selected plants, and our
            happiness guarantee. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="pricing__toggle" role="group" aria-label="Billing period">
            <button
              className={`pricing__toggle-btn ${billing === 'monthly' ? 'active' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
            <button
              className={`pricing__toggle-btn ${billing === 'annual' ? 'active' : ''}`}
              onClick={() => setBilling('annual')}
            >
              Annual
              <span className="pricing__toggle-save">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="pricing__grid">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`pricing__card ${tier.badge ? 'pricing__card--featured' : ''} ${selected === tier.id ? 'pricing__card--selected' : ''}`}
              onClick={() => setSelected(tier.id === selected ? null : tier.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(tier.id === selected ? null : tier.id)}
              aria-pressed={selected === tier.id}
            >
              {/* Badge */}
              {tier.badge && (
                <span className="pricing__badge">
                  <Sparkles size={12} /> {tier.badge}
                </span>
              )}

              {/* Tier header */}
              <div className="pricing__card-header">
                <h3 className="pricing__tier-name">{tier.name}</h3>
                <p className="pricing__tier-tagline">{tier.tagline}</p>
              </div>

              {/* Price */}
              <div className="pricing__price-block">
                <span className="pricing__currency">$</span>
                <span className="pricing__amount">{getPrice(tier.price)}</span>
                <span className="pricing__period">/ {tier.period}</span>
              </div>
              {billing === 'annual' && (
                <p className="pricing__annual-note">
                  Billed ${getPrice(tier.price) * 12}/year
                </p>
              )}

              {/* Sample plants */}
              <div className="pricing__plants">
                <p className="pricing__plants-label">Sample plants:</p>
                <div className="pricing__plant-tags">
                  {tier.plants.map((p) => (
                    <span key={p} className="pricing__plant-chip">{p}</span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <ul className="pricing__features">
                {tier.features.map((feat) => (
                  <li key={feat} className="pricing__feature">
                    <Check size={15} strokeWidth={2.5} className="pricing__check" />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`btn btn--full ${tier.badge ? 'btn--primary' : 'btn--outline'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(tier.id);
                }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="pricing__footnote">
          🌱 All plans include a 30-day happiness guarantee. Not happy? We'll replace your plants or refund you — no questions asked.
        </p>
      </div>
    </section>
  );
}
