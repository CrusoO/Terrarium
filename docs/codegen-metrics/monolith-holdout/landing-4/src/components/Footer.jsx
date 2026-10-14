import React from 'react';
import { business } from '../data/content.js';

export default function Footer() {
  const scrollTo = (href) => {
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <span>🐾</span>
            <span>{business.name}</span>
          </div>
          <p className="footer__tagline">{business.tagline}</p>
          <p className="footer__location">📍 {business.location}</p>
        </div>

        <div className="footer__links">
          <h4 className="footer__heading">Quick Links</h4>
          <ul>
            {[
              { label: 'Services', href: '#services' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Testimonials', href: '#testimonials' },
              { label: 'Book Now', href: '#contact' },
            ].map((link) => (
              <li key={link.href}>
                <button className="footer__link" onClick={() => scrollTo(link.href)}>
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer__contact">
          <h4 className="footer__heading">Contact</h4>
          <ul>
            <li><a href={`tel:${business.phone}`}>{business.phone}</a></li>
            <li><a href={`mailto:${business.email}`}>{business.email}</a></li>
            <li><span>{business.instagram}</span></li>
          </ul>
        </div>

        <div className="footer__hours">
          <h4 className="footer__heading">Walk Hours</h4>
          <ul>
            <li>Mon – Fri: 7am – 7pm</li>
            <li>Saturday: 8am – 5pm</li>
            <li>Sunday: 9am – 3pm</li>
            <li className="footer__hours-note">Overnight stays: 7 days/week</li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} {business.name} Dog Walking · {business.location} · All rights reserved.</p>
          <p className="footer__bottom-note">Insured & bonded · Pet First Aid Certified · Background-checked walkers</p>
        </div>
      </div>
    </footer>
  );
}
