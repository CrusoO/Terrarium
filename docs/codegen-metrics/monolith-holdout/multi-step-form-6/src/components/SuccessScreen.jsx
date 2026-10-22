import React from 'react';
import { CheckCircle, FileText, MapPin, Wrench } from 'lucide-react';
import { formatWorkType, generatePermitNumber } from '../utils/helpers.js';

/**
 * Shown after the user submits the permit application.
 * Displays a confirmation with a generated permit number.
 */
export default function SuccessScreen({ wizardData, onReset }) {
  const permitNumber = generatePermitNumber();
  const { address, workType } = wizardData;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-icon">🏗️</span>
            <span className="brand-name">PermitPortal</span>
          </div>
          <span className="header-subtitle">Building Permit Application</span>
        </div>
      </header>

      <main className="wizard-main">
        <div className="success-card">
          <div className="success-icon-wrap">
            <CheckCircle size={56} className="success-icon" />
          </div>
          <h1 className="success-title">Application Submitted!</h1>
          <p className="success-message">
            Your permit application has been received and is pending review by the
            Municipal Building Department.
          </p>

          <div className="permit-number-badge">
            <FileText size={16} />
            <span>Permit #&nbsp;<strong>{permitNumber}</strong></span>
          </div>

          <div className="success-summary">
            <div className="summary-row">
              <MapPin size={16} className="summary-icon" />
              <div>
                <span className="summary-label">Property Address</span>
                <span className="summary-value">
                  {address.street}, {address.city}, {address.state} {address.zip}
                </span>
              </div>
            </div>
            <div className="summary-row">
              <Wrench size={16} className="summary-icon" />
              <div>
                <span className="summary-label">Work Type</span>
                <span className="summary-value">{formatWorkType(workType.type)}</span>
              </div>
            </div>
          </div>

          <p className="success-note">
            You will receive a confirmation email within 2 business days. Please keep
            your permit number for your records.
          </p>

          <button className="btn btn-primary" onClick={onReset}>
            Submit Another Application
          </button>
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2024 PermitPortal · Municipal Services Division</p>
      </footer>
    </div>
  );
}
