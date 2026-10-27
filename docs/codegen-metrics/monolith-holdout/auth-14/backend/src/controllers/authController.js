const userStore = require('../models/userStore');

/**
 * Generates a simple mock JWT-like token for demo purposes.
 * In production, use the `jsonwebtoken` package with a real secret.
 */
function generateMockToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64url');
  const signature = Buffer.from(`mock-sig-${userId}`).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Returns: { token: string, user: { id, name, email } }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user in the in-memory store
    const user = userStore.findByEmail(normalizedEmail);

    if (!user) {
      // Use a generic message to avoid email enumeration
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare password (plain-text comparison for demo; use bcrypt in production)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateMockToken(user.id);

    // Return token and safe user object (no password)
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
