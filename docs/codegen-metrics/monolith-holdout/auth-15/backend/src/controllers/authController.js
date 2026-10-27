import jwt from 'jsonwebtoken';
import { userStore } from '../models/userStore.js';
import { JWT_SECRET } from '../config/env.js';

/** Sign a JWT for a user */
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

/** POST /api/auth/register */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    const existing = userStore.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await userStore.create({ name, email, password });
    const token = signToken(user);

    return res.status(201).json({ user: userStore.toPublic(user), token });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = userStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const valid = await userStore.verifyPassword(user, password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    return res.json({ user: userStore.toPublic(user), token });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/forgot-password */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = userStore.findByEmail(email);

    // Always respond with 200 to avoid user enumeration.
    // In production you would send an email here.
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const resetToken = userStore.setResetToken(user);

    // In a real app this token would be emailed. We return it in dev so the
    // frontend can surface a clickable link for testing.
    return res.json({
      message: 'If that email is registered, a reset link has been sent.',
      resetToken, // dev-only: remove in production
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/reset-password */
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const user = userStore.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }
    if (user.resetExpiry < Date.now()) {
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    await userStore.updatePassword(user, newPassword);
    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}
