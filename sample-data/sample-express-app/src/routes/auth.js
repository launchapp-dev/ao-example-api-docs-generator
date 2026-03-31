const express = require('express');
const router = express.Router();

/**
 * POST /auth/login
 * Authenticate user credentials and return a JWT token.
 *
 * @body {string} email - User email address
 * @body {string} password - User password (min 8 chars)
 * @returns {object} token - JWT access token
 * @returns {object} user - Basic user info
 * @throws {401} Invalid credentials
 * @throws {400} Validation error
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'email and password are required'
    });
  }

  // Simulate auth check
  if (email === 'demo@example.com' && password === 'password123') {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample';
    return res.json({
      token,
      expires_in: 3600,
      user: { id: 'usr_123', email, name: 'Demo User', role: 'user' }
    });
  }

  return res.status(401).json({
    error: 'UNAUTHORIZED',
    message: 'Invalid email or password'
  });
});

/**
 * POST /auth/register
 * Create a new user account.
 *
 * @body {string} email - Unique email address
 * @body {string} password - Password (min 8 chars)
 * @body {string} name - Full display name
 * @returns {object} user - Newly created user
 * @throws {409} Email already in use
 * @throws {400} Validation error
 */
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'email, password, and name are required'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'password must be at least 8 characters'
    });
  }

  const user = {
    id: `usr_${Date.now()}`,
    email,
    name,
    role: 'user',
    created_at: new Date().toISOString()
  };

  return res.status(201).json({ user });
});

/**
 * POST /auth/refresh
 * Refresh an expired JWT token using a refresh token.
 *
 * @body {string} refresh_token - Valid refresh token
 * @returns {object} token - New JWT access token
 * @throws {401} Invalid or expired refresh token
 */
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'refresh_token is required'
    });
  }

  // Simulate token refresh
  return res.json({
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshed',
    expires_in: 3600
  });
});

/**
 * POST /auth/logout
 * Invalidate the current session token.
 *
 * @header {string} Authorization - Bearer JWT token
 * @returns {object} message - Confirmation
 */
router.post('/logout', (req, res) => {
  return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
