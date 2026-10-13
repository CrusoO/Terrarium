import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

/**
 * In-memory user store.
 * Persists for the lifetime of the Node process.
 */
const users = [];

// Seed a demo user so the login flow can be tested immediately
async function seedDemo() {
  const hash = await bcrypt.hash('password123', 10);
  users.push({
    id: 'demo-001',
    name: 'Demo User',
    email: 'demo@example.com',
    passwordHash: hash,
    resetToken: null,
    resetExpiry: null,
  });
}
seedDemo();

export const userStore = {
  /** Find a user by email (case-insensitive) */
  findByEmail(email) {
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  /** Find a user by their reset token */
  findByResetToken(token) {
    return users.find((u) => u.resetToken === token) || null;
  },

  /** Find a user by id */
  findById(id) {
    return users.find((u) => u.id === id) || null;
  },

  /** Create a new user and return the stored record */
  async create({ name, email, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: `user-${randomBytes(6).toString('hex')}`,
      name,
      email: email.toLowerCase(),
      passwordHash,
      resetToken: null,
      resetExpiry: null,
    };
    users.push(user);
    return user;
  },

  /** Set a password-reset token with a 1-hour expiry */
  setResetToken(user) {
    const token = randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    return token;
  },

  /** Update a user's password and clear the reset token */
  async updatePassword(user, newPassword) {
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetExpiry = null;
  },

  /** Verify a plain-text password against the stored hash */
  async verifyPassword(user, plainPassword) {
    return bcrypt.compare(plainPassword, user.passwordHash);
  },

  /** Return a safe public view of a user (no hash) */
  toPublic(user) {
    return { id: user.id, name: user.name, email: user.email };
  },
};
