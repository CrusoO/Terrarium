import React, { useState } from 'react';
import { validateContactInfo, isValid } from '../../utils/helpers.js';
import NavButtons from '../NavButtons.jsx';

export default function ContactInfo({ contactInfo, onNext }) {
  const [form, setForm] = useState({ ...contactInfo });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNext = () => {
    const errs = validateContactInfo(form);
    if (!isValid(errs)) {
      setErrors(errs);
      return;
    }
    onNext(form);
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2 className="step-title">Contact Information</h2>
        <p className="step-subtitle">Tell us a bit about yourself so we can confirm your registration.</p>
      </div>

      <form className="form-grid" onSubmit={(e) => e.preventDefault()} noValidate>
        <div className="form-row">
          <div className={`form-field ${errors.firstName ? 'has-error' : ''}`}>
            <label htmlFor="firstName">First Name <span className="required">*</span></label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Jane"
              autoComplete="given-name"
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <span id="firstName-error" className="field-error" role="alert">{errors.firstName}</span>
            )}
          </div>

          <div className={`form-field ${errors.lastName ? 'has-error' : ''}`}>
            <label htmlFor="lastName">Last Name <span className="required">*</span></label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Smith"
              autoComplete="family-name"
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <span id="lastName-error" className="field-error" role="alert">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className={`form-field ${errors.email ? 'has-error' : ''}`}>
          <label htmlFor="email">Email Address <span className="required">*</span></label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="jane.smith@example.com"
            autoComplete="email"
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <span id="email-error" className="field-error" role="alert">{errors.email}</span>
          )}
        </div>

        <div className={`form-field ${errors.phone ? 'has-error' : ''}`}>
          <label htmlFor="phone">Phone Number <span className="required">*</span></label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="(555) 867-5309"
            autoComplete="tel"
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <span id="phone-error" className="field-error" role="alert">{errors.phone}</span>
          )}
        </div>
      </form>

      <NavButtons step={1} onNext={handleNext} isLastStep={false} />
    </div>
  );
}
