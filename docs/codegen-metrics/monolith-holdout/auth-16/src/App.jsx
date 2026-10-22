import React, { useState } from 'react';
import SignInForm from './components/SignInForm.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);

  return (
    <div className="app-root">
      {authenticated ? (
        <Dashboard onSignOut={() => setAuthenticated(false)} />
      ) : (
        <SignInForm onSuccess={() => setAuthenticated(true)} />
      )}
    </div>
  );
}
