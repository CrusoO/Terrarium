import React from 'react';
import { Leaf, Instagram, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  const handleNav = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="footer" className="footer">
      <div className="footer__inner">
        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__logo">
            <Leaf size={20} strokeWidth={2.2} />
            <span>Leafy</span>
          </div>
          <p className="footer__tagline">
            Bringing nature indoors, one plant at a time. Sustainably sourced,
            lovingly packed, and delivered to your door.
          </p>
          <div className="footer__socials">
            <a href="#" className="footer__social" aria-label="Instagram" onClick={(e) => e.preventDefault()}>
              <Instagram size={18} />
            </a>
            <a href="#" className="footer__social" aria-label="Twitter" onClick={(e) => e.preventDefault()}>
              <Twitter size={18} />
            </a>
            <a href="#" className="footer__social" aria-label="Email" onClick={(e) => e.preventDefault()}>
              <Mail size={18} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="footer__links-group">
          <h4 className="footer__links-title">Shop</h4>
          <ul className="footer__links">
            <li><button className="footer__link" onClick={() => handleNav('#pricing')}>Starter Plan</button></li>
            <li><button className="footer__link" onClick={() => handleNav('#pricing')}>Garden Plan</button></li>
            <li><button className="footer__link" onClick={() => handleNav('#pricing')}>Greenhouse Plan</button></li>
            <li><button className="footer__link" onClick={() => handleNav('#pricing')}>Gift a Plant</button></li>
          </ul>
        </div>

        <div className="footer__links-group">
          <h4 className="footer__links-title">Company</h4>
          <ul className="footer__links">
            <li><button className="footer__link" onClick={() => handleNav('#hero')}>About Us</button></li>
            <li><button className="footer__link" onClick={() => handleNav('#hero')}>Sustainability</button></li>
            <li><button className="footer__link" onClick={() => handleNav('#hero')}>Blog</button></li>
            <li><button className="footer__link" onClick={() => handleNav('#hero')}>Careers</button></li>
          </ul>
        </div>

        <div className="footer__links-group">
          <h4 className="footer__links-title">Support</h4>
          <ul className="footer__links">
            <li><button className="footer__link" onClick={() => handleNav('#hero')}>FAQ</button></li>
            <li><button className="footer__link" onClick={() => handleNav('#hero')}>Shipping Info</button></li>
            <li><button className="footer__link" onClick={() => handleNav('#hero')}>Plant Care Hub</button></li>
            <li><button className="footer__link" onClick={() => handleNav('#hero')}>Contact Us</button></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} Leafy Plant Shop. All rights reserved.</p>
        <div className="footer__legal">
          <button className="footer__link footer__link--sm">Privacy Policy</button>
          <button className="footer__link footer__link--sm">Terms of Service</button>
        </div>
      </div>
    </footer>
  );
}
