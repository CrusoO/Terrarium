import React, { useState } from 'react';
import { services } from '../data/content.js';

export default function Services() {
  const [activeService, setActiveService] = useState(null);

  return (
    <section className="section services" id="services">
      <div className="container">
        <div className="section__header">
          <span className="section__eyebrow">What We Offer</span>
          <h2 className="section__title">Services Tailored to Every Pup</h2>
          <p className="section__subtitle">
            From solo adventures to overnight stays, we have the perfect option for your dog's needs and your schedule.
          </p>
        </div>

        <div className="services__grid">
          {services.map((service) => (
            <div
              key={service.id}
              className={`service-card ${activeService === service.id ? 'service-card--active' : ''}`}
              onClick={() => setActiveService(activeService === service.id ? null : service.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveService(activeService === service.id ? null : service.id)}
              aria-expanded={activeService === service.id}
            >
              {service.highlight && (
                <span className="service-card__badge">{service.highlight}</span>
              )}
              <div className="service-card__icon">{service.icon}</div>
              <h3 className="service-card__title">{service.title}</h3>
              <p className="service-card__desc">{service.description}</p>
              <span className="service-card__cta">
                {activeService === service.id ? 'Close ↑' : 'Learn more →'}
              </span>
              {activeService === service.id && (
                <div className="service-card__expanded">
                  <ul className="service-card__details">
                    <li>✅ Certified, background-checked walker</li>
                    <li>✅ Real-time GPS route shared with you</li>
                    <li>✅ Post-walk photo report via text</li>
                    <li>✅ Fully insured & bonded</li>
                  </ul>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Book This Service
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
