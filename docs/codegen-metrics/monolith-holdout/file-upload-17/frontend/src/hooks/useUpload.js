import { useState, useCallback } from 'react';
import { RECEIPTS_ENDPOINT } from '../../../shared/constants.js';

export default function useUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const upload = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(RECEIPTS_ENDPOINT, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type header — browser sets it with boundary automatically
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      setSuccess(true);
      return data;
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return { upload, loading, error, success, reset };
}
