import React, { useState, useEffect } from 'react';
import { studio } from '../data/studioData.js';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Home', href: '#hero' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#footer' },
  ];

  const handleNav = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <button className="navbar__logo" onClick={() => handleNav('#hero')}>
          <span className="navbar__logo-icon">🏺</span>
          <span className="navbar__logo-text">{studio.name}</span>
        </button>

        {/* Desktop links */}
        <nav className="navbar__links" aria-label="Primary navigation">
          {links.map((l) => (
            <button key={l.href} className="navbar__link" onClick={() => handleNav(l.href)}>
              {l.label}
            </button>
          ))}
          <button className="btn btn--primary btn--sm" onClick={() => handleNav('#pricing')}>
            Book a Class
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="navbar__hamburger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
          <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
          <span className={`hamburger-line${menuOpen ? ' open' : ''}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="navbar__drawer" aria-label="Mobile navigation">
          {links.map((l) => (
            <button key={l.href} className="navbar__drawer-link" onClick={() => handleNav(l.href)}>
              {l.label}
            </button>
          ))}
          <button
            className="btn btn--primary"
            style={{ marginTop: '8px' }}
            onClick={() => handleNav('#pricing')}
          >
            Book a Class
          </button>
        </nav>
      )}
    </header>
  );
}
