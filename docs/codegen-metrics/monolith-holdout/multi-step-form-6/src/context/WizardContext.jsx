import React, { createContext, useContext } from 'react';

const WizardContext = createContext(null);

/**
 * WizardProvider wraps the wizard steps and provides shared state + actions.
 * The actual state lives in App.jsx; this context just distributes it.
 */
export function WizardProvider({ children, value }) {
  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside WizardProvider');
  return ctx;
}
