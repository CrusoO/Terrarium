import React, { useEffect, useState } from 'react';
import { bakeryInfo } from '../data/bakeryData.js';

function Hero({ onCtaClick }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Sticky nav */}
      <header className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
        <div className="nav__inner">
          <span className="nav__logo">🥐 {bakeryInfo.name}</span>
          <nav className="nav__links">
            <a href="#menu-teaser" className="nav__link">Menu</a>
            <a href="#footer" className="nav__link">Visit Us</a>
            <button className="btn btn--sm" onClick={onCtaClick}>Order Today</button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero" aria-label="Hero">
        <div className="hero__backdrop" aria-hidden="true" />
        <div className="hero__content">
          <p className="hero__eyebrow">Est. {bakeryInfo.established} · Riverside, CA</p>
          <h1 className="hero__title">{bakeryInfo.name}</h1>
          <p className="hero__tagline">{bakeryInfo.tagline}</p>
          <div className="hero__actions">
            <button className="btn btn--primary btn--lg" onClick={onCtaClick}>
              See Our Menu
            </button>
            <a href="#footer" className="btn btn--ghost btn--lg">Find Us</a>
          </div>
          <div className="hero__badges">
            <span className="hero__badge">🌾 Stone-milled flour</span>
            <span className="hero__badge">🧈 Local dairy</span>
            <span className="hero__badge">☀️ Baked fresh daily</span>
          </div>
        </div>
        <div className="hero__scroll-hint" aria-hidden="true">
          <span>↓</span>
        </div>
      </section>
    </>
  );
}

export default Hero;
