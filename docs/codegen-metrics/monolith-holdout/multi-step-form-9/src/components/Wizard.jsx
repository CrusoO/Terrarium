import React from 'react';
import useWizardState from '../hooks/useWizardState.js';
import ProgressBar from './ProgressBar.jsx';
import ContactInfo from './steps/ContactInfo.jsx';
import CourseSelection from './steps/CourseSelection.jsx';
import Waiver from './steps/Waiver.jsx';
import Review from './steps/Review.jsx';

export default function Wizard() {
  const {
    step,
    contactInfo,
    selectedCourse,
    waiverAccepted,
    submitted,
    goToStep,
    nextStep,
    prevStep,
    updateContactInfo,
    setSelectedCourse,
    setWaiverAccepted,
    handleSubmit,
    reset,
  } = useWizardState();

  if (submitted) {
    return (
      <div className="wizard-card">
        <div className="success-screen">
          <div className="success-icon" aria-hidden="true">🎉</div>
          <h2 className="success-title">Registration Confirmed!</h2>
          <p className="success-message">
            Thank you, <strong>{contactInfo.firstName} {contactInfo.lastName}</strong>! Your registration for{' '}
            <strong>{selectedCourse?.title}</strong> on <strong>{selectedCourse?.date}</strong> has been received.
          </p>
          <p className="success-email">
            A confirmation will be sent to <strong>{contactInfo.email}</strong>.
          </p>
          <div className="success-summary">
            <div className="success-row">
              <span>Course</span>
              <span>{selectedCourse?.title}</span>
            </div>
            <div className="success-row">
              <span>Date</span>
              <span>{selectedCourse?.date}</span>
            </div>
            <div className="success-row">
              <span>Instructor</span>
              <span>{selectedCourse?.instructor}</span>
            </div>
            <div className="success-row total">
              <span>Total Paid</span>
              <span>${selectedCourse?.price}.00</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={reset}>
            Register for Another Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-card">
      <ProgressBar currentStep={step} />
      <div className="wizard-body">
        {step === 1 && (
          <ContactInfo
            contactInfo={contactInfo}
            onNext={(data) => { updateContactInfo(data); nextStep(); }}
          />
        )}
        {step === 2 && (
          <CourseSelection
            selectedCourse={selectedCourse}
            onNext={(course) => { setSelectedCourse(course); nextStep(); }}
            onBack={prevStep}
          />
        )}
        {step === 3 && (
          <Waiver
            waiverAccepted={waiverAccepted}
            onNext={(accepted) => { setWaiverAccepted(accepted); nextStep(); }}
            onBack={prevStep}
          />
        )}
        {step === 4 && (
          <Review
            contactInfo={contactInfo}
            selectedCourse={selectedCourse}
            waiverAccepted={waiverAccepted}
            onBack={prevStep}
            onSubmit={handleSubmit}
            onEdit={goToStep}
          />
        )}
      </div>
    </div>
  );
}
