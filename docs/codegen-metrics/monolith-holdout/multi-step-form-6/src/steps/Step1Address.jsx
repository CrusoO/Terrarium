import React, { useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { useWizard } from '../context/WizardContext.jsx';
import { validateAddress, US_STATES } from '../utils/helpers.js';

/**
 * Step 1: Collects the property address for the permit application.
 */
export default function Step1Address() {
  const { wizardData, updateAddress, goNext } = useWizard();
  const [errors, setErrors] = useState({});
  const addr = wizardData.address;

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateAddress({ [name]: value });
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNext = () => {
    const validationErrors = validateAddress(addr);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    goNext();
  };

  return (
    <div className="step-panel">
      <div className="step-header">
        <MapPin size={22} className="step-header-icon" />
        <div>
          <h2 className="step-title">Property Address</h2>
          <p className="step-description">
            Enter the address of the property where the permitted work will take place.
          </p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="street" className="form-label">
            Street Address <span className="required">*</span>
          </label>
          <input
            id="street"
            name="street"
            type="text"
            className={`form-input ${errors.street ? 'input-error' : ''}`}
            placeholder="123 Main Street"
            value={addr.street}
            onChange={handleChange}
            autoComplete="street-address"
          />
          {errors.street && <FieldError message={errors.street} />}
        </div>

        <div className="form-group full-width">
          <label htmlFor="city" className="form-label">
            City <span className="required">*</span>
          </label>
          <input
            id="city"
            name="city"
            type="text"
            className={`form-input ${errors.city ? 'input-error' : ''}`}
            placeholder="Springfield"
            value={addr.city}
            onChange={handleChange}
            autoComplete="address-level2"
          />
          {errors.city && <FieldError message={errors.city} />}
        </div>

        <div className="form-group">
          <label htmlFor="state" className="form-label">
            State <span className="required">*</span>
          </label>
          <select
            id="state"
            name="state"
            className={`form-select ${errors.state ? 'input-error' : ''}`}
            value={addr.state}
            onChange={handleChange}
            autoComplete="address-level1"
          >
            <option value="">Select a state…</option>
            {US_STATES.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.state && <FieldError message={errors.state} />}
        </div>

        <div className="form-group">
          <label htmlFor="zip" className="form-label">
            ZIP Code <span className="required">*</span>
          </label>
          <input
            id="zip"
            name="zip"
            type="text"
            className={`form-input ${errors.zip ? 'input-error' : ''}`}
            placeholder="62701"
            value={addr.zip}
            onChange={handleChange}
            maxLength={10}
            autoComplete="postal-code"
          />
          {errors.zip && <FieldError message={errors.zip} />}
        </div>
      </div>

      <div className="step-actions">
        <span />
        <button className="btn btn-primary" onClick={handleNext}>
          Next: Work Type →
        </button>
      </div>
    </div>
  );
}

function FieldError({ message }) {
  return (
    <span className="field-error" role="alert">
      <AlertCircle size={13} />
      {message}
    </span>
  );
}
