import React, { useState } from 'react';
import ShootCard from './ShootCard.jsx';
import shoots from '../data/shoots.js';

export default function Portfolio() {
  const [activeId, setActiveId] = useState(null);

  const handleSelect = (id) => {
    setActiveId(prev => prev === id ? null : id);
  };

  return (
    <section className="portfolio" id="portfolio">
      <div className="section-inner">
        <div className="section-header">
          <p className="section-eyebrow">Selected Work</p>
          <h2 className="section-title">Recent Shoots</h2>
          <p className="section-subtitle">
            A glimpse into three recent projects — each one a collaboration between
            great food, careful styling, and the right light.
          </p>
        </div>

        <div className="shoots-grid">
          {shoots.map(shoot => (
            <ShootCard
              key={shoot.id}
              shoot={shoot}
              isActive={activeId === shoot.id}
              onSelect={() => handleSelect(shoot.id)}
            />
          ))}
        </div>

        {/* Expanded detail panel */}
        {activeId && (() => {
          const shoot = shoots.find(s => s.id === activeId);
          return (
            <div className="shoot-detail" role="region" aria-label={`Details for ${shoot.title}`}>
              <button className="detail-close" onClick={() => setActiveId(null)} aria-label="Close details">✕</button>
              <div className="detail-content">
                <p className="detail-eyebrow">{shoot.category}</p>
                <h3 className="detail-title">{shoot.title}</h3>
                <p className="detail-description">{shoot.longDescription}</p>
                <div className="detail-meta">
                  {shoot.meta.map((item, i) => (
                    <div key={i} className="meta-item">
                      <span className="meta-label">{item.label}</span>
                      <span className="meta-value">{item.value}</span>
                    </div>
                  ))}
                </div>
                <a href="#quote" className="btn btn-primary" onClick={() => setActiveId(null)}>
                  Book a Similar Shoot
                </a>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
