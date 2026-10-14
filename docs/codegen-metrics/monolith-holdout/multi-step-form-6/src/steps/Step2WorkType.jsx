import React, { useState } from 'react';
import { Wrench, AlertCircle } from 'lucide-react';
import { useWizard } from '../context/WizardContext.jsx';
import { validateWorkType, WORK_TYPES } from '../utils/helpers.js';

/**
 * Step 2: Collects the type of work and an optional description.
 */
export default function Step2WorkType() {
  const { wizardData, updateWorkType, goNext, goBack } = useWizard();
  const [errors, setErrors] = useState({});
  const work = wizardData.workType;

  const handleTypeChange = (e) => {
    updateWorkType({ type: e.target.value });
    if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
  };

  const handleDescChange = (e) => {
    updateWorkType({ description: e.target.value });
    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
  };

  const handleNext = () => {
    const validationErrors = validateWorkType(work);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    goNext();
  };

  return (
    <div className="step-panel">
      <div className="step-header">
        <Wrench size={22} className="step-header-icon" />
        <div>
          <h2 className="step-title">Work Type</h2>
          <p className="step-description">
            Select the category that best describes the permitted work and provide
            a brief description.
          </p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group full-width">
          <fieldset className="radio-fieldset">
            <legend className="form-label">
              Work Category <span className="required">*</span>
            </legend>
            <div className="radio-group">
              {WORK_TYPES.map((wt) => (
                <label
                  key={wt.value}
                  className={`radio-card ${work.type === wt.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="workType"
                    value={wt.value}
                    checked={work.type === wt.value}
                    onChange={handleTypeChange}
                    className="radio-input"
                  />
                  <span className="radio-icon">{wt.icon}</span>
                  <span className="radio-label">{wt.label}</span>
                  <span className="radio-desc">{wt.description}</span>
                </label>
              ))}
            </div>
            {errors.type && (
              <span className="field-error" role="alert">
                <AlertCircle size={13} />
                {errors.type}
              </span>
            )}
          </fieldset>
        </div>

        <div className="form-group full-width">
          <label htmlFor="description" className="form-label">
            Project Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            className={`form-textarea ${errors.description ? 'input-error' : ''}`}
            placeholder="Describe the scope of work in detail — materials, dimensions, and any structural changes…"
            value={work.description}
            onChange={handleDescChange}
            rows={4}
          />
          <span className="char-count">{work.description.length} / 500 characters</span>
          {errors.description && (
            <span className="field-error" role="alert">
              <AlertCircle size={13} />
              {errors.description}
            </span>
          )}
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={goBack}>
          ← Back
        </button>
        <button className="btn btn-primary" onClick={handleNext}>
          Next: Review →
        </button>
      </div>
    </div>
  );
}
