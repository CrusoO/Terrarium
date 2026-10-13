import React from 'react';
import { ClipboardList, MapPin, Wrench, Edit2 } from 'lucide-react';
import { useWizard } from '../context/WizardContext.jsx';
import { formatWorkType } from '../utils/helpers.js';

/**
 * Step 3: Read-only review of all collected data before submission.
 */
export default function Step3Review({ onSubmit }) {
  const { wizardData, goBack } = useWizard();
  const { address, workType } = wizardData;

  return (
    <div className="step-panel">
      <div className="step-header">
        <ClipboardList size={22} className="step-header-icon" />
        <div>
          <h2 className="step-title">Review Your Application</h2>
          <p className="step-description">
            Please confirm all details are correct before submitting your permit
            application.
          </p>
        </div>
      </div>

      <div className="review-sections">
        {/* Address Section */}
        <div className="review-section">
          <div className="review-section-header">
            <div className="review-section-title">
              <MapPin size={16} />
              <span>Property Address</span>
            </div>
            <button
              className="edit-link"
              onClick={goBack}
              aria-label="Edit work type"
            >
              <Edit2 size={13} />
              Edit
            </button>
          </div>
          <div className="review-fields">
            <ReviewField label="Street Address" value={address.street} />
            <ReviewField label="City" value={address.city} />
            <ReviewField label="State" value={address.state} />
            <ReviewField label="ZIP Code" value={address.zip} />
          </div>
        </div>

        {/* Work Type Section */}
        <div className="review-section">
          <div className="review-section-header">
            <div className="review-section-title">
              <Wrench size={16} />
              <span>Work Type</span>
            </div>
          </div>
          <div className="review-fields">
            <ReviewField label="Work Category" value={formatWorkType(workType.type)} />
            <ReviewField
              label="Project Description"
              value={workType.description}
              fullWidth
            />
          </div>
        </div>
      </div>

      <div className="review-disclaimer">
        <p>
          By submitting this application, you certify that the information provided
          is accurate and complete. Falsification of permit information may result
          in permit revocation and legal penalties.
        </p>
      </div>

      <div className="step-actions">
        <button className="btn btn-secondary" onClick={goBack}>
          ← Back
        </button>
        <button className="btn btn-submit" onClick={onSubmit}>
          Submit Application
        </button>
      </div>
    </div>
  );
}

function ReviewField({ label, value, fullWidth }) {
  return (
    <div className={`review-field ${fullWidth ? 'full-width' : ''}`}>
      <span className="review-field-label">{label}</span>
      <span className="review-field-value">{value || '—'}</span>
    </div>
  );
}
