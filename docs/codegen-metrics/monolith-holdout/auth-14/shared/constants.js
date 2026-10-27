/**
 * Shared constants used across frontend and backend.
 */

const API_ROUTES = {
  AUTH_LOGIN: '/api/auth/login',
  HEALTH:     '/api/health',
};

const AUTH = {
  TOKEN_KEY: 'token',
  USER_KEY:  'user',
};

// Export for Node (CommonJS) and browser (ESM)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_ROUTES, AUTH };
} else {
  export { API_ROUTES, AUTH };
}
