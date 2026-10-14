import React from 'react';
import { ArrowDown, Wrench, Users, Leaf } from 'lucide-react';

const stats = [
  { icon: <Users size={20} />, value: '400+', label: 'Active Members' },
  { icon: <Wrench size={20} />, value: '1,200+', label: 'Bikes Repaired' },
  { icon: <Leaf size={20} />, value: '12 yrs', label: 'Serving Our Community' },
];

export default function Hero() {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero__overlay" />
        <div className="hero__content">
          <span className="hero__eyebrow">Community-Powered Cycling</span>
          <h1 className="hero__headline">
            Keep Your Wheels<br />Turning Together
          </h1>
          <p className="hero__subheadline">
            Spoke &amp; Soil is a member-owned bike co-op offering affordable repairs,
            a shared tool library, and a welcoming space for every kind of rider.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary btn--lg" onClick={scrollToPricing}>
              View Memberships
            </button>
            <button className="btn btn--ghost btn--lg" onClick={scrollToAbout}>
              Learn More
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <button className="hero__scroll-cue" onClick={scrollToAbout} aria-label="Scroll down">
          <ArrowDown size={20} />
        </button>
      </section>

      {/* Stats bar */}
      <div className="stats-bar">
        {stats.map((s) => (
          <div key={s.label} className="stats-bar__item">
            <span className="stats-bar__icon">{s.icon}</span>
            <span className="stats-bar__value">{s.value}</span>
            <span className="stats-bar__label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* About section */}
      <section className="about" id="about">
        <div className="about__inner">
          <div className="about__text">
            <span className="section-eyebrow">Who We Are</span>
            <h2 className="section-heading">A shop owned by riders, for riders</h2>
            <p>
              Founded in 2012, Spoke &amp; Soil started as a weekend pop-up in a neighbor's
              garage. Today we're a thriving co-op with a dedicated workshop, hundreds of
              members, and a mission to make cycling accessible to everyone — regardless
              of budget or experience level.
            </p>
            <p>
              Members get access to our full tool library, expert-led repair clinics,
              and a community that genuinely loves bikes. Whether you're fixing a flat
              or rebuilding a vintage ten-speed, there's a place for you here.
            </p>
          </div>
          <div className="about__cards">
            {[
              { title: 'Open Shop Nights', desc: 'Drop in every Tuesday & Thursday evening. Bring your bike, we'll bring the tools and know-how.' },
              { title: 'Repair Clinics', desc: 'Monthly workshops covering everything from basic maintenance to wheel truing and brake bleeding.' },
              { title: 'Youth Program', desc: 'Free Saturday sessions for riders under 18. Learn mechanics, earn a refurbished bike.' },
            ].map((card) => (
              <div key={card.title} className="about__card">
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
