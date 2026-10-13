import React from 'react';
import ClaimWizard from './components/ClaimWizard.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">📋</span>
          <span className="app-brand">ClaimCenter</span>
        </div>
      </header>
      <main className="app-main">
        <ClaimWizard />
      </main>
      <footer className="app-footer">
        <p>© 2024 ClaimCenter. All rights reserved.</p>
      </footer>
    </div>
  );
}
