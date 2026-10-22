import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Returns a `request` function that wraps fetch with:
 * - JSON headers
 * - Authorization header when a token is present
 * - Automatic JSON parsing and error extraction
 */
export function useApi() {
  const { token } = useAuth();

  const request = useCallback(
    async (url, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      };

      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data.message || data.error || `Request failed (${res.status})`;
        throw new Error(message);
      }

      return data;
    },
    [token]
  );

  return { request };
}
