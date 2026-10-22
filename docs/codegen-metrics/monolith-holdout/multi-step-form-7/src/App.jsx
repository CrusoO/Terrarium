import React from 'react';
import WizardShell from './components/WizardShell.jsx';
import useWizard from './hooks/useWizard.js';

export default function App() {
  const wizard = useWizard();

  return (
    <div className="app-bg">
      <WizardShell wizard={wizard} />
    </div>
  );
}
