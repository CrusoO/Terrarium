import { useState } from 'react';

/**
 * Manages all claim wizard state: current step, field values,
 * validation errors, and the submitted flag.
 */
export function useClaimForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [claimDate, setClaimDate] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [dateError, setDateError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Validate and advance from Step 1 → 2
  function goToStep2() {
    if (!claimDate) {
      setDateError('Please select a date for your claim.');
      return;
    }
    const selected = new Date(claimDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) {
      setDateError('Claim date cannot be in the future.');
      return;
    }
    setDateError('');
    setCurrentStep(2);
  }

  // Validate and advance from Step 2 → 3
  function goToStep3() {
    const parsed = parseFloat(claimAmount);
    if (!claimAmount || isNaN(parsed)) {
      setAmountError('Please enter a valid claim amount.');
      return;
    }
    if (parsed <= 0) {
      setAmountError('Claim amount must be greater than $0.00.');
      return;
    }
    if (parsed > 1_000_000) {
      setAmountError('Claim amount cannot exceed $1,000,000.00.');
      return;
    }
    setAmountError('');
    setCurrentStep(3);
  }

  function goBack() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  function submitClaim() {
    setSubmitted(true);
  }

  function resetForm() {
    setCurrentStep(1);
    setClaimDate('');
    setClaimAmount('');
    setDateError('');
    setAmountError('');
    setSubmitted(false);
  }

  return {
    currentStep,
    claimDate,
    setClaimDate,
    claimAmount,
    setClaimAmount,
    dateError,
    amountError,
    submitted,
    goToStep2,
    goToStep3,
    goBack,
    submitClaim,
    resetForm,
  };
}
