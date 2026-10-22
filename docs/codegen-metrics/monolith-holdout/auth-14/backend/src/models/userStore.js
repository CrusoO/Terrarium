/**
 * In-memory user store seeded with demo credentials.
 * Replace with a real database (e.g. PostgreSQL + bcrypt) in production.
 */

const users = [
  {
    id: 'usr_001',
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password123', // plain-text for demo only
  },
  {
    id: 'usr_002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'jane1234',
  },
];

const userStore = {
  /**
   * Find a user by email (case-insensitive).
   * @param {string} email
   * @returns {object|undefined}
   */
  findByEmail(email) {
    return users.find((u) => u.email === email.toLowerCase());
  },

  /**
   * Find a user by ID.
   * @param {string} id
   * @returns {object|undefined}
   */
  findById(id) {
    return users.find((u) => u.id === id);
  },

  /**
   * Return all users (without passwords).
   */
  listSafe() {
    return users.map(({ id, name, email }) => ({ id, name, email }));
  },
};

module.exports = userStore;
