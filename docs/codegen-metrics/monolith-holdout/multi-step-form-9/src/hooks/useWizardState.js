import { useState } from 'react';

const INITIAL_CONTACT = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};

export default function useWizardState() {
  const [step, setStep] = useState(1);
  const [contactInfo, setContactInfo] = useState(INITIAL_CONTACT);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const goToStep = (n) => setStep(n);
  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const updateContactInfo = (fields) =>
    setContactInfo((prev) => ({ ...prev, ...fields }));

  const handleSubmit = () => {
    const payload = { contactInfo, selectedCourse, waiverAccepted };
    console.log('Registration submitted:', payload);
    setSubmitted(true);
  };

  const reset = () => {
    setStep(1);
    setContactInfo(INITIAL_CONTACT);
    setSelectedCourse(null);
    setWaiverAccepted(false);
    setSubmitted(false);
  };

  return {
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
  };
}
