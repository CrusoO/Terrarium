import React, { useState, useEffect } from 'react';
import { Leaf, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'Plants', href: '#pricing' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#footer' },
  ];

  const handleNav = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <button className="navbar__logo" onClick={() => handleNav('#hero')}>
          <Leaf size={22} strokeWidth={2.2} />
          <span>Leafy</span>
        </button>

        {/* Desktop links */}
        <ul className="navbar__links">
          {navLinks.map((link) => (
            <li key={link.label}>
              <button className="navbar__link" onClick={() => handleNav(link.href)}>
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button className="btn btn--sm btn--primary navbar__cta" onClick={() => handleNav('#pricing')}>
          Shop Now
        </button>

        {/* Mobile hamburger */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar__mobile">
          {navLinks.map((link) => (
            <button key={link.label} className="navbar__mobile-link" onClick={() => handleNav(link.href)}>
              {link.label}
            </button>
          ))}
          <button className="btn btn--primary navbar__mobile-cta" onClick={() => handleNav('#pricing')}>
            Shop Now
          </button>
        </div>
      )}
    </nav>
  );
}
