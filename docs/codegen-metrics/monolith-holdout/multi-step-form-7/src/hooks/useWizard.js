import { useState } from 'react';

export const TEAMS = ['Engineering', 'Design', 'Marketing', 'Product', 'Operations'];

export const TOTAL_STEPS = 3;

export default function useWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const goNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const submit = () => {
    setSubmitted(true);
  };

  const reset = () => {
    setCurrentStep(0);
    setName('');
    setTeam('');
    setSubmitted(false);
  };

  return {
    currentStep,
    name,
    setName,
    team,
    setTeam,
    submitted,
    goNext,
    goBack,
    submit,
    reset,
  };
}
