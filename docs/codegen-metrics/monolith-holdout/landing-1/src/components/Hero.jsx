import React from 'react';
import { studio } from '../data/studioData.js';

export default function Hero() {
  const handleScroll = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="hero">
      {/* Decorative background shapes */}
      <div className="hero__bg-circle hero__bg-circle--1" aria-hidden="true" />
      <div className="hero__bg-circle hero__bg-circle--2" aria-hidden="true" />

      <div className="hero__content">
        <span className="hero__eyebrow">Portland's Favorite Pottery Studio</span>
        <h1 className="hero__headline">{studio.tagline}</h1>
        <p className="hero__sub">{studio.subtagline}</p>

        <div className="hero__actions">
          <button className="btn btn--primary btn--lg" onClick={() => handleScroll('#pricing')}>
            {studio.ctaLabel}
          </button>
          <button className="btn btn--outline btn--lg" onClick={() => handleScroll('#about')}>
            {studio.secondaryCtaLabel}
          </button>
        </div>

        {/* Trust badges */}
        <div className="hero__badges">
          <span className="hero__badge">⭐ 4.9 on Google</span>
          <span className="hero__badge">🏆 Best Studio 2023</span>
          <span className="hero__badge">🌿 Eco-Friendly Clay</span>
        </div>
      </div>

      {/* Illustration panel */}
      <div className="hero__visual" aria-hidden="true">
        <div className="hero__pottery-scene">
          <div className="pottery-wheel">
            <div className="pottery-wheel__base" />
            <div className="pottery-wheel__clay" />
            <div className="pottery-wheel__hands" />
          </div>
          <div className="pottery-shelf">
            <div className="shelf-item shelf-item--vase" />
            <div className="shelf-item shelf-item--bowl" />
            <div className="shelf-item shelf-item--mug" />
          </div>
        </div>
      </div>
    </section>
  );
}
