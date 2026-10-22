import React, { useState } from 'react';
import AppShell from './components/AppShell.jsx';
import DropBoxForm from './components/DropBoxForm.jsx';
import SubmissionList from './components/SubmissionList.jsx';
import useSubmissions from './hooks/useSubmissions.js';

export default function App() {
  const { submissions, addSubmission, clearAll } = useSubmissions();
  const [lastSubmission, setLastSubmission] = useState(null);

  function handleSubmit(submissionData) {
    const newSub = addSubmission(submissionData);
    setLastSubmission(newSub);
  }

  function handleDismissConfirmation() {
    setLastSubmission(null);
  }

  return (
    <AppShell>
      <div className="app-content">
        <DropBoxForm
          onSubmit={handleSubmit}
          lastSubmission={lastSubmission}
          onDismissConfirmation={handleDismissConfirmation}
        />
        <SubmissionList submissions={submissions} onClearAll={clearAll} />
      </div>
    </AppShell>
  );
}
