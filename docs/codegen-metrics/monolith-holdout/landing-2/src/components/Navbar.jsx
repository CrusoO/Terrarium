import React, { useState, useEffect } from 'react';
import { Bike, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <button className="navbar__logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Bike size={26} strokeWidth={2} />
          <span>Spoke &amp; Soil</span>
        </button>

        {/* Desktop links */}
        <ul className="navbar__links">
          <li><button onClick={() => handleNavClick('about')}>About</button></li>
          <li><button onClick={() => handleNavClick('pricing')}>Membership</button></li>
          <li><button onClick={() => handleNavClick('contact')}>Contact</button></li>
          <li>
            <button className="btn btn--primary btn--sm" onClick={() => handleNavClick('pricing')}>
              Join Now
            </button>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="navbar__drawer">
          <button onClick={() => handleNavClick('about')}>About</button>
          <button onClick={() => handleNavClick('pricing')}>Membership</button>
          <button onClick={() => handleNavClick('contact')}>Contact</button>
          <button className="btn btn--primary" onClick={() => handleNavClick('pricing')}>
            Join Now
          </button>
        </div>
      )}
    </nav>
  );
}
