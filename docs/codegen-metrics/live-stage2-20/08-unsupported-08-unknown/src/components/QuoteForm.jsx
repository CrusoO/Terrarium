import React, { useState } from 'react';

const INITIAL_STATE = {
  name: '',
  email: '',
  projectType: '',
  budget: '',
  message: '',
};

const PROJECT_TYPES = [
  'Restaurant Menu Photography',
  'Brand / Product Campaign',
  'Cookbook or Editorial',
  'Social Media Content',
  'Event or Pop-up Coverage',
  'Other',
];

const BUDGET_RANGES = [
  'Under €500',
  '€500 – €1,500',
  '€1,500 – €3,000',
  '€3,000 – €6,000',
  '€6,000+',
  'Not sure yet',
];

export default function QuoteForm() {
  const [form, setForm] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Please enter your name.';
    if (!form.email.trim()) {
      newErrors.email = 'Please enter your email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!form.projectType) newErrors.projectType = 'Please select a project type.';
    if (!form.budget) newErrors.budget = 'Please select a budget range.';
    if (!form.message.trim()) newErrors.message = 'Please describe your project.';
    else if (form.message.trim().length < 20) newErrors.message = 'Please add a bit more detail (at least 20 characters).';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm(INITIAL_STATE);
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <section className="quote-section" id="quote">
        <div className="section-inner">
          <div className="success-state">
            <div className="success-icon" aria-hidden="true">✦</div>
            <h2 className="success-title">Thanks, {form.name.split(' ')[0]}!</h2>
            <p className="success-message">
              Your quote request has been received. I'll review your project details
              and get back to you at <strong>{form.email}</strong> within 1–2 business days.
            </p>
            <button className="btn btn-outline" onClick={handleReset}>
              Submit another request
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="quote-section" id="quote">
      <div className="section-inner">
        <div className="section-header">
          <p className="section-eyebrow">Work With Me</p>
          <h2 className="section-title">Request a Quote</h2>
          <p className="section-subtitle">
            Tell me about your project and I'll put together a tailored proposal.
            All enquiries are responded to within two business days.
          </p>
        </div>

        <form className="quote-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            {/* Name */}
            <div className={`form-group ${errors.name ? 'form-group--error' : ''}`}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Sophie Müller"
                value={form.name}
                onChange={handleChange}
                aria-describedby={errors.name ? 'name-error' : undefined}
                autoComplete="name"
              />
              {errors.name && <span className="field-error" id="name-error" role="alert">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className={`form-group ${errors.email ? 'form-group--error' : ''}`}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="sophie@example.com"
                value={form.email}
                onChange={handleChange}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
              />
              {errors.email && <span className="field-error" id="email-error" role="alert">{errors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            {/* Project Type */}
            <div className={`form-group ${errors.projectType ? 'form-group--error' : ''}`}>
              <label htmlFor="projectType">Project Type</label>
              <select
                id="projectType"
                name="projectType"
                value={form.projectType}
                onChange={handleChange}
                aria-describedby={errors.projectType ? 'projectType-error' : undefined}
              >
                <option value="">Select a project type…</option>
                {PROJECT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.projectType && <span className="field-error" id="projectType-error" role="alert">{errors.projectType}</span>}
            </div>

            {/* Budget */}
            <div className={`form-group ${errors.budget ? 'form-group--error' : ''}`}>
              <label htmlFor="budget">Budget Range</label>
              <select
                id="budget"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                aria-describedby={errors.budget ? 'budget-error' : undefined}
              >
                <option value="">Select a budget range…</option>
                {BUDGET_RANGES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.budget && <span className="field-error" id="budget-error" role="alert">{errors.budget}</span>}
            </div>
          </div>

          {/* Message */}
          <div className={`form-group ${errors.message ? 'form-group--error' : ''}`}>
            <label htmlFor="message">Project Details</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="Tell me about your project — the dishes, the vibe, the timeline, and anything else that matters to you."
              value={form.message}
              onChange={handleChange}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            {errors.message && <span className="field-error" id="message-error" role="alert">{errors.message}</span>}
          </div>

          <div className="form-footer">
            <p className="form-note">No spam, ever. Your details are used only to respond to your enquiry.</p>
            <button type="submit" className="btn btn-primary btn-submit">
              Send Quote Request
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
