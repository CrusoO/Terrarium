import React from 'react';
import Wizard from './components/Wizard.jsx';

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-inner">
          <span className="header-logo">🎓</span>
          <span className="header-title">Course Registration</span>
        </div>
      </header>
      <main className="app-main">
        <Wizard />
      </main>
      <footer className="app-footer">
        <p>© 2024 Learning Center. All rights reserved.</p>
      </footer>
    </div>
  );
}
