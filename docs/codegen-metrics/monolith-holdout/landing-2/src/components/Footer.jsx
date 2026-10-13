import React from 'react';
import { Bike, MapPin, Mail, Phone, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="footer" id="contact">
      <div className="footer__inner">
        {/* Brand column */}
        <div className="footer__brand">
          <div className="footer__logo">
            <Bike size={24} strokeWidth={2} />
            <span>Spoke &amp; Soil</span>
          </div>
          <p className="footer__tagline">
            Community-powered cycling since 2012. Member-owned, community-run.
          </p>
          <div className="footer__social">
            <a href="#" aria-label="Instagram" className="footer__social-link">
              <Instagram size={20} />
            </a>
            <a href="#" aria-label="Facebook" className="footer__social-link">
              <Facebook size={20} />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div className="footer__col">
          <h4>Quick Links</h4>
          <ul>
            <li><button onClick={() => scrollTo('about')}>About Us</button></li>
            <li><button onClick={() => scrollTo('pricing')}>Membership</button></li>
            <li><button onClick={() => scrollTo('pricing')}>Repair Clinics</button></li>
            <li><button onClick={() => scrollTo('pricing')}>Youth Program</button></li>
          </ul>
        </div>

        {/* Hours */}
        <div className="footer__col">
          <h4>Shop Hours</h4>
          <ul className="footer__hours">
            <li><span>Tuesday</span><span>5 – 9 pm</span></li>
            <li><span>Thursday</span><span>5 – 9 pm</span></li>
            <li><span>Saturday</span><span>10 am – 2 pm</span></li>
            <li><span>Sunday</span><span>Closed</span></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer__col">
          <h4>Contact</h4>
          <ul className="footer__contact">
            <li>
              <MapPin size={16} />
              <span>842 Elm Street, Portland, OR 97201</span>
            </li>
            <li>
              <Mail size={16} />
              <span>hello@spokeandsoil.coop</span>
            </li>
            <li>
              <Phone size={16} />
              <span>(503) 555-0184</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} Spoke &amp; Soil Bike Co-op. All rights reserved.</p>
        <p>A member-owned cooperative — not a corporation.</p>
      </div>
    </footer>
  );
}
