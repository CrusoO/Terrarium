import React from 'react';
import NavButtons from '../NavButtons.jsx';

export default function Review({ contactInfo, selectedCourse, waiverAccepted, onBack, onSubmit, onEdit }) {
  return (
    <div className="step-container">
      <div className="step-header">
        <h2 className="step-title">Review Your Registration</h2>
        <p className="step-subtitle">Please confirm your details before submitting. Use the Edit buttons to make changes.</p>
      </div>

      <div className="review-sections">
        {/* Contact Info */}
        <div className="review-section">
          <div className="review-section-header">
            <h3>Contact Information</h3>
            <button type="button" className="btn-edit" onClick={() => onEdit(1)}>
              Edit
            </button>
          </div>
          <div className="review-grid">
            <div className="review-field">
              <span className="review-label">First Name</span>
              <span className="review-value">{contactInfo.firstName}</span>
            </div>
            <div className="review-field">
              <span className="review-label">Last Name</span>
              <span className="review-value">{contactInfo.lastName}</span>
            </div>
            <div className="review-field">
              <span className="review-label">Email</span>
              <span className="review-value">{contactInfo.email}</span>
            </div>
            <div className="review-field">
              <span className="review-label">Phone</span>
              <span className="review-value">{contactInfo.phone}</span>
            </div>
          </div>
        </div>

        {/* Course */}
        <div className="review-section">
          <div className="review-section-header">
            <h3>Selected Course</h3>
            <button type="button" className="btn-edit" onClick={() => onEdit(2)}>
              Edit
            </button>
          </div>
          {selectedCourse ? (
            <div className="review-course-card">
              <div className="review-course-title">{selectedCourse.title}</div>
              <div className="review-course-details">
                <span>📅 {selectedCourse.date} &nbsp;·&nbsp; 🕐 {selectedCourse.time}</span>
                <span>👤 {selectedCourse.instructor}</span>
                <span>📍 {selectedCourse.location}</span>
              </div>
              <div className="review-course-price">
                <span className="review-label">Course Fee</span>
                <span className="review-price-value">${selectedCourse.price}</span>
              </div>
            </div>
          ) : (
            <p className="review-empty">No course selected.</p>
          )}
        </div>

        {/* Waiver */}
        <div className="review-section">
          <div className="review-section-header">
            <h3>Liability Waiver</h3>
            <button type="button" className="btn-edit" onClick={() => onEdit(3)}>
              Edit
            </button>
          </div>
          <div className="review-waiver-status">
            {waiverAccepted ? (
              <span className="waiver-status accepted">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="8" fill="#16a34a" />
                  <path d="M4 8l2.5 2.5L12 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Waiver accepted
              </span>
            ) : (
              <span className="waiver-status declined">⚠ Waiver not yet accepted</span>
            )}
          </div>
        </div>

        {/* Total */}
        {selectedCourse && (
          <div className="review-total">
            <span className="review-total-label">Total Due</span>
            <span className="review-total-value">${selectedCourse.price}.00</span>
          </div>
        )}
      </div>

      <NavButtons
        step={4}
        onBack={onBack}
        onSubmit={onSubmit}
        isLastStep={true}
        submitLabel="Submit Registration"
      />
    </div>
  );
}
