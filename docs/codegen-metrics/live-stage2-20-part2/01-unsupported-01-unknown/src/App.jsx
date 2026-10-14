import React from 'react';
import { studioInfo } from './data/studioInfo.js';

// ── Address Block ──────────────────────────────────────────────
function AddressBlock({ address }) {
  return (
    <div className="address-block">
      <div className="address-icon" aria-hidden="true">📍</div>
      <div className="address-text">
        <p className="address-street">{address.street}, {address.suite}</p>
        <p className="address-city">{address.city}, {address.state} {address.zip}</p>
        <p className="address-neighborhood">{address.neighborhood}</p>
        <a
          className="directions-link"
          href={address.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get Directions →
        </a>
      </div>
    </div>
  );
}

// ── Hours Card ─────────────────────────────────────────────────
function HoursCard({ day, date, open, close, note }) {
  return (
    <div className="hours-card">
      <div className="hours-day-row">
        <span className="hours-day">{day}</span>
        <span className="hours-date">{date}</span>
      </div>
      <div className="hours-time">
        {open} – {close}
      </div>
      {note && <p className="hours-note">{note}</p>}
    </div>
  );
}

// ── Activity Card ──────────────────────────────────────────────
function ActivityCard({ icon, title, description }) {
  return (
    <div className="activity-card">
      <div className="activity-icon" aria-hidden="true">{icon}</div>
      <div className="activity-body">
        <h3 className="activity-title">{title}</h3>
        <p className="activity-desc">{description}</p>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const s = studioInfo;

  return (
    <div className="page">
      {/* ── Hero ── */}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-badge">Open Studio</div>
          <h1 className="hero-title">{s.name}</h1>
          <p className="hero-tagline">{s.tagline}</p>
          <p className="hero-description">{s.description}</p>
          <div className="admission-pill">{s.admission}</div>
        </div>
        <div className="hero-decoration" aria-hidden="true">
          <span className="deco-circle deco-1" />
          <span className="deco-circle deco-2" />
          <span className="deco-circle deco-3" />
        </div>
      </header>

      <main className="content">
        {/* ── Location & Hours ── */}
        <section className="section" aria-labelledby="visit-heading">
          <h2 className="section-heading" id="visit-heading">When & Where</h2>
          <div className="visit-grid">
            <div className="visit-col">
              <h3 className="col-label">Location</h3>
              <AddressBlock address={s.address} />
            </div>
            <div className="visit-col">
              <h3 className="col-label">Hours</h3>
              <div className="hours-list">
                {s.hours.map((h) => (
                  <HoursCard key={h.day} {...h} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Activities ── */}
        <section className="section" aria-labelledby="activities-heading">
          <h2 className="section-heading" id="activities-heading">What You Can Try</h2>
          <div className="activities-grid">
            {s.activities.map((a) => (
              <ActivityCard key={a.title} {...a} />
            ))}
          </div>
        </section>

        {/* ── Closing Note ── */}
        <section className="closing-section" aria-label="Closing note">
          <div className="closing-card">
            <div className="closing-icon" aria-hidden="true">🌿</div>
            <p className="closing-text">{s.closingNote}</p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <p className="footer-studio">{s.name}</p>
          <div className="footer-contacts">
            <a href={`mailto:${s.contact.email}`} className="footer-link">
              {s.contact.email}
            </a>
            <span className="footer-sep" aria-hidden="true">·</span>
            <span className="footer-link">{s.contact.phone}</span>
            <span className="footer-sep" aria-hidden="true">·</span>
            <span className="footer-link">{s.contact.instagram}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
