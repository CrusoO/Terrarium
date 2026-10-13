/**
 * API helper — wraps fetch calls to the Express backend.
 * All paths are relative so the Vite proxy routes them correctly.
 */

export async function postLogin({ email, password }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Throw with the server's error message if available
    throw new Error(data.message || 'Login failed.');
  }

  return data;
}
