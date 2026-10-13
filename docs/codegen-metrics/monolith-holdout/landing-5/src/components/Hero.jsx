import React from 'react';
import { ArrowRight, Leaf, Droplets, Sun } from 'lucide-react';
import { featuredStats } from '../data/plants.js';

export default function Hero() {
  const handleShop = () => {
    const el = document.querySelector('#pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLearnMore = () => {
    const el = document.querySelector('#footer');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="hero">
      {/* Background blobs */}
      <div className="hero__blob hero__blob--1" aria-hidden="true" />
      <div className="hero__blob hero__blob--2" aria-hidden="true" />

      <div className="hero__inner">
        {/* Left: copy */}
        <div className="hero__copy">
          <span className="hero__eyebrow">
            <Leaf size={14} strokeWidth={2.5} />
            Plant subscriptions, delivered monthly
          </span>

          <h1 className="hero__headline">
            Bring the<br />
            <span className="hero__headline--accent">outdoors in.</span>
          </h1>

          <p className="hero__subtext">
            Handpicked plants, expert care guides, and beautiful pots — curated
            for your space and delivered straight to your door every month.
          </p>

          <div className="hero__actions">
            <button className="btn btn--primary btn--lg" onClick={handleShop}>
              Explore Plans <ArrowRight size={18} />
            </button>
            <button className="btn btn--ghost btn--lg" onClick={handleLearnMore}>
              Learn More
            </button>
          </div>

          {/* Trust badges */}
          <div className="hero__badges">
            <span className="hero__badge">
              <Droplets size={14} /> Easy care guides
            </span>
            <span className="hero__badge">
              <Sun size={14} /> Thrives indoors
            </span>
            <span className="hero__badge">
              <Leaf size={14} /> Eco packaging
            </span>
          </div>
        </div>

        {/* Right: visual card */}
        <div className="hero__visual">
          <div className="hero__plant-card">
            <div className="hero__plant-emoji" aria-hidden="true">🌿</div>
            <div className="hero__plant-info">
              <p className="hero__plant-name">Monstera Deliciosa</p>
              <p className="hero__plant-sub">This month's featured plant</p>
            </div>
            <span className="hero__plant-tag">Garden Plan</span>
          </div>

          <div className="hero__floating hero__floating--1" aria-hidden="true">🪴</div>
          <div className="hero__floating hero__floating--2" aria-hidden="true">🌱</div>
          <div className="hero__floating hero__floating--3" aria-hidden="true">🌸</div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="hero__stats">
        {featuredStats.map((stat) => (
          <div key={stat.label} className="hero__stat">
            <span className="hero__stat-value">{stat.value}</span>
            <span className="hero__stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
