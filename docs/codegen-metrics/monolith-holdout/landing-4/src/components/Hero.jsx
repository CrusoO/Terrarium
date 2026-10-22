import React from 'react';
import { business } from '../data/content.js';

export default function Hero() {
  const handleScroll = (href) => {
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="home">
      <div className="hero__bg-shapes">
        <div className="hero__shape hero__shape--1" />
        <div className="hero__shape hero__shape--2" />
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <span className="hero__badge">🌿 Serving Portland since {business.founded}</span>
          <h1 className="hero__headline">
            Your Dog Deserves the <span className="hero__headline-accent">Best Walk</span> of Their Day
          </h1>
          <p className="hero__subtext">
            Professional, insured, and genuinely passionate dog walking in Portland. We treat every pup like family — with GPS tracking, photo updates, and a wagging tail guaranteed.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary btn--lg" onClick={() => handleScroll('#contact')}>
              Book a Free Meet & Greet
            </button>
            <button className="btn btn--outline btn--lg" onClick={() => handleScroll('#services')}>
              See Our Services
            </button>
          </div>
          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-number">500+</span>
              <span className="hero__stat-label">Happy Dogs</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">6 yrs</span>
              <span className="hero__stat-label">Experience</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">4.9★</span>
              <span className="hero__stat-label">Avg Rating</span>
            </div>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__image-card">
            <div className="hero__dog-illustration">
              <div className="dog-scene">
                <div className="dog-scene__sky">
                  <span className="dog-scene__cloud">☁️</span>
                  <span className="dog-scene__cloud dog-scene__cloud--2">☁️</span>
                  <span className="dog-scene__sun">☀️</span>
                </div>
                <div className="dog-scene__main">
                  <span className="dog-scene__walker">🧑</span>
                  <span className="dog-scene__leash">〰️</span>
                  <span className="dog-scene__dog">🐕</span>
                </div>
                <div className="dog-scene__ground">
                  <span className="dog-scene__grass">🌿🌿🌿🌿🌿🌿</span>
                </div>
              </div>
            </div>
            <div className="hero__badge-float hero__badge-float--1">
              <span>📍</span> GPS Tracked
            </div>
            <div className="hero__badge-float hero__badge-float--2">
              <span>📸</span> Photo Updates
            </div>
            <div className="hero__badge-float hero__badge-float--3">
              <span>🛡️</span> Fully Insured
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
