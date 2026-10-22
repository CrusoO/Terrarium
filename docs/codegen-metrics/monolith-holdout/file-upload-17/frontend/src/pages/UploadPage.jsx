import React, { useState } from 'react';
import UploadForm from '../components/UploadForm.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import useUpload from '../hooks/useUpload.js';

export default function UploadPage({ onSuccess }) {
  const { upload, loading, error, success, reset } = useUpload();
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (formData) => {
    const result = await upload(formData);
    if (result) {
      // Reset form after short delay so user sees success banner
      setTimeout(() => {
        setFormKey((k) => k + 1);
        reset();
        onSuccess();
      }, 1800);
    }
  };

  return (
    <div className="page page--upload">
      <div className="page-header">
        <h1 className="page-title">Submit a Receipt</h1>
        <p className="page-subtitle">
          Fill in your name, add any notes, then attach or capture a photo of
          your receipt.
        </p>
      </div>

      {success && (
        <StatusBanner
          type="success"
          message="Receipt submitted successfully! Redirecting to the log…"
        />
      )}
      {error && (
        <StatusBanner
          type="error"
          message={error}
          onDismiss={reset}
        />
      )}

      <UploadForm
        key={formKey}
        onSubmit={handleSubmit}
        loading={loading}
        disabled={success}
      />
    </div>
  );
}
