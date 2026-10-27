import React from 'react';
import { studio } from '../data/studioData.js';

export default function Footer() {
  const handleNav = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">🏺 {studio.name}</span>
          <p className="footer__tagline">Where every piece tells a story.</p>
        </div>

        <div className="footer__cols">
          <div className="footer__col">
            <h4 className="footer__col-title">Studio</h4>
            <button className="footer__link" onClick={() => handleNav('#hero')}>Home</button>
            <button className="footer__link" onClick={() => handleNav('#pricing')}>Pricing</button>
            <button className="footer__link" onClick={() => handleNav('#about')}>About</button>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Contact</h4>
            <a href={`mailto:${studio.contact}`} className="footer__link">{studio.contact}</a>
            <a href={`tel:${studio.phone}`} className="footer__link">{studio.phone}</a>
            <span className="footer__link footer__address">{studio.address}</span>
          </div>

          <div className="footer__col">
            <h4 className="footer__col-title">Hours</h4>
            <span className="footer__link">Mon–Fri: 9am – 9pm</span>
            <span className="footer__link">Saturday: 10am – 7pm</span>
            <span className="footer__link">Sunday: 11am – 5pm</span>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} {studio.name} Pottery Studio. All rights reserved.</p>
        <p>Made with 🤍 and a lot of clay in Portland, OR.</p>
      </div>
    </footer>
  );
}
