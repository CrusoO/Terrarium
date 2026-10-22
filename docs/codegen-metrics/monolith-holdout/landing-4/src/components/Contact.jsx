import React, { useState } from 'react';
import { business } from '../data/content.js';

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  dogName: '',
  dogBreed: '',
  service: '',
  message: '',
};

export default function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Your name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'A valid email is required.';
    if (!form.dogName.trim()) e.dogName = "Your dog's name is required.";
    if (!form.service) e.service = 'Please select a service.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <section className="section contact" id="contact">
        <div className="container">
          <div className="contact__success">
            <div className="contact__success-icon">🐾</div>
            <h2>Woof! We got your message!</h2>
            <p>
              Thanks, <strong>{form.name}</strong>! We'll reach out to schedule a free meet & greet for <strong>{form.dogName}</strong> within 24 hours.
            </p>
            <p className="contact__success-sub">Check your inbox at {form.email} for a confirmation.</p>
            <button className="btn btn--outline btn--lg" onClick={handleReset}>
              Submit Another Request
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section contact" id="contact">
      <div className="container">
        <div className="contact__inner">
          <div className="contact__info">
            <span className="section__eyebrow">Get in Touch</span>
            <h2 className="section__title" style={{ textAlign: 'left' }}>
              Book a Free Meet & Greet
            </h2>
            <p className="contact__info-text">
              Every new client starts with a complimentary 30-minute meet & greet so your dog can get comfortable with their walker before the first walk.
            </p>
            <ul className="contact__details">
              <li>
                <span className="contact__detail-icon">📞</span>
                <a href={`tel:${business.phone}`}>{business.phone}</a>
              </li>
              <li>
                <span className="contact__detail-icon">✉️</span>
                <a href={`mailto:${business.email}`}>{business.email}</a>
              </li>
              <li>
                <span className="contact__detail-icon">📍</span>
                <span>{business.location}</span>
              </li>
              <li>
                <span className="contact__detail-icon">📸</span>
                <span>{business.instagram}</span>
              </li>
            </ul>
            <div className="contact__trust">
              <span className="contact__trust-badge">🛡️ Fully Insured</span>
              <span className="contact__trust-badge">✅ Background Checked</span>
              <span className="contact__trust-badge">🐾 Pet First Aid Certified</span>
            </div>
          </div>

          <form className="contact__form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Your Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dogName" className="form-label">Dog's Name *</label>
                <input
                  id="dogName"
                  name="dogName"
                  type="text"
                  className={`form-input ${errors.dogName ? 'form-input--error' : ''}`}
                  placeholder="Biscuit"
                  value={form.dogName}
                  onChange={handleChange}
                />
                {errors.dogName && <span className="form-error">{errors.dogName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="dogBreed" className="form-label">Breed (optional)</label>
                <input
                  id="dogBreed"
                  name="dogBreed"
                  type="text"
                  className="form-input"
                  placeholder="Golden Retriever"
                  value={form.dogBreed}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone (optional)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="(555) 000-0000"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="service" className="form-label">Service Interested In *</label>
                <select
                  id="service"
                  name="service"
                  className={`form-input form-select ${errors.service ? 'form-input--error' : ''}`}
                  value={form.service}
                  onChange={handleChange}
                >
                  <option value="">Select a service…</option>
                  <option value="solo-walk">Solo Walk ($35)</option>
                  <option value="group-walk">Group Walk ($22)</option>
                  <option value="puppy-visit">Puppy Visit</option>
                  <option value="overnight">Overnight Stay</option>
                  <option value="monthly-bundle">Monthly Bundle ($280)</option>
                </select>
                {errors.service && <span className="form-error">{errors.service}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">Anything else we should know?</label>
              <textarea
                id="message"
                name="message"
                className="form-input form-textarea"
                placeholder="Tell us about your dog's personality, any special needs, preferred walk times…"
                rows={4}
                value={form.message}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn btn--primary btn--lg btn--full">
              Request Free Meet & Greet 🐾
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
