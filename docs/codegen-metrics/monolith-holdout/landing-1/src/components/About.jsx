import React from 'react';
import { about } from '../data/studioData.js';

export default function About() {
  return (
    <section id="about" className="about">
      <div className="section-container">
        <div className="about__layout">
          {/* Visual side */}
          <div className="about__visual" aria-hidden="true">
            <div className="about__image-frame">
              <div className="about__image-placeholder">
                <div className="about__kiln-icon">🏺</div>
                <p className="about__image-caption">Clay & Fire Studio, Portland OR</p>
              </div>
              {/* Floating accent card */}
              <div className="about__accent-card">
                <span className="about__accent-icon">🔥</span>
                <div>
                  <strong>Wood-Fired Kilns</strong>
                  <p>Authentic high-fire results</p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="about__stats">
              {about.stats.map((s) => (
                <div key={s.label} className="about__stat">
                  <span className="about__stat-value">{s.value}</span>
                  <span className="about__stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Text side */}
          <div className="about__text">
            <span className="section-eyebrow">Our Story</span>
            <h2 className="section-title about__title">{about.headline}</h2>
            {about.body.map((para, i) => (
              <p key={i} className="about__para">{para}</p>
            ))}
            <button
              className="btn btn--primary"
              onClick={() => {
                const el = document.querySelector('#pricing');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Classes & Pricing
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
