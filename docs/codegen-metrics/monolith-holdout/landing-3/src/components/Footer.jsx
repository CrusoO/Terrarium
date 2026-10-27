import React from 'react';
import { bakeryInfo } from '../data/bakeryData.js';

function Footer() {
  return (
    <footer id="footer" className="footer" aria-label="Footer">
      <div className="footer__inner">
        {/* Brand column */}
        <div className="footer__col footer__col--brand">
          <div className="footer__logo">🥐 {bakeryInfo.name}</div>
          <p className="footer__tagline">
            Handcrafted with care since {bakeryInfo.established}.<br />
            Come for the bread, stay for the community.
          </p>
          <div className="footer__social">
            <button className="footer__social-btn" onClick={() => alert('Follow us on Instagram @goldencrumbbakery!')}>
              Instagram
            </button>
            <button className="footer__social-btn" onClick={() => alert('Like us on Facebook!')}>
              Facebook
            </button>
          </div>
        </div>

        {/* Hours column */}
        <div className="footer__col">
          <h4 className="footer__heading">Hours</h4>
          <ul className="footer__hours">
            {Object.entries(bakeryInfo.hours).map(([day, time]) => (
              <li key={day} className="footer__hours-row">
                <span className="footer__hours-day">{day}</span>
                <span className="footer__hours-time">{time}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact column */}
        <div className="footer__col">
          <h4 className="footer__heading">Visit Us</h4>
          <address className="footer__address">
            <p>📍 {bakeryInfo.address}</p>
            <p>📞 <a href={`tel:${bakeryInfo.phone}`} className="footer__link">{bakeryInfo.phone}</a></p>
            <p>✉️ <a href={`mailto:${bakeryInfo.email}`} className="footer__link">{bakeryInfo.email}</a></p>
          </address>
          <div className="footer__map-placeholder" aria-label="Map placeholder">
            <span>🗺️ Find us on Google Maps</span>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} {bakeryInfo.name}. All rights reserved.</p>
        <p>Made with 🧈 and a lot of love.</p>
      </div>
    </footer>
  );
}

export default Footer;
