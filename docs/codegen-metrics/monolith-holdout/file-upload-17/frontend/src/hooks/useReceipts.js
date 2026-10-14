import { useState, useEffect, useCallback } from 'react';
import { RECEIPTS_ENDPOINT } from '../../../shared/constants.js';

export default function useReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(RECEIPTS_ENDPOINT);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      // Sort newest first
      const sorted = [...data].sort(
        (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );
      setReceipts(sorted);
    } catch (err) {
      setError(err.message || 'Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  return { receipts, loading, error, refetch: fetchReceipts };
}
