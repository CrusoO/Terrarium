import React, { useState } from 'react';
import { WizardProvider } from './context/WizardContext.jsx';
import StepIndicator from './components/StepIndicator.jsx';
import Step1Address from './steps/Step1Address.jsx';
import Step2WorkType from './steps/Step2WorkType.jsx';
import Step3Review from './steps/Step3Review.jsx';
import SuccessScreen from './components/SuccessScreen.jsx';

const STEPS = ['Address', 'Work Type', 'Review'];

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [wizardData, setWizardData] = useState({
    address: { street: '', city: '', state: '', zip: '' },
    workType: { type: '', description: '' },
  });

  const updateAddress = (fields) =>
    setWizardData((prev) => ({ ...prev, address: { ...prev.address, ...fields } }));

  const updateWorkType = (fields) =>
    setWizardData((prev) => ({ ...prev, workType: { ...prev.workType, ...fields } }));

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));
  const handleSubmit = () => setSubmitted(true);
  const handleReset = () => {
    setWizardData({
      address: { street: '', city: '', state: '', zip: '' },
      workType: { type: '', description: '' },
    });
    setCurrentStep(0);
    setSubmitted(false);
  };

  if (submitted) {
    return <SuccessScreen wizardData={wizardData} onReset={handleReset} />;
  }

  return (
    <WizardProvider value={{ wizardData, updateAddress, updateWorkType, goNext, goBack }}>
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
          <div className="wizard-card">
            <StepIndicator steps={STEPS} currentStep={currentStep} />

            <div className="step-content">
              {currentStep === 0 && <Step1Address />}
              {currentStep === 1 && <Step2WorkType />}
              {currentStep === 2 && <Step3Review onSubmit={handleSubmit} />}
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <p>© 2024 PermitPortal · Municipal Services Division</p>
        </footer>
      </div>
    </WizardProvider>
  );
}
