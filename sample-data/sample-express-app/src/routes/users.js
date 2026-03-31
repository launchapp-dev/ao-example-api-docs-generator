const express = require('express');
const router = express.Router();

// Middleware stub
const auth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token required' });
  next();
};

/**
 * GET /users
 * List all users with pagination. Requires admin role.
 *
 * @header {string} Authorization - Bearer JWT token (admin required)
 * @query {number} page - Page number (default: 1)
 * @query {number} per_page - Items per page (default: 20, max: 100)
 * @query {string} search - Search by name or email
 * @query {string} role - Filter by role: user | admin | moderator
 * @returns {object[]} users - Array of user objects
 * @returns {object} pagination - Pagination metadata
 */
router.get('/', auth, (req, res) => {
  const { page = 1, per_page = 20, search = '', role } = req.query;
  const users = [
    { id: 'usr_001', email: 'alice@example.com', name: 'Alice Chen', role: 'admin', created_at: '2025-01-15T10:00:00Z' },
    { id: 'usr_002', email: 'bob@example.com', name: 'Bob Martinez', role: 'user', created_at: '2025-02-20T14:30:00Z' },
    { id: 'usr_003', email: 'carol@example.com', name: 'Carol White', role: 'moderator', created_at: '2025-03-01T09:15:00Z' }
  ];
  return res.json({
    users,
    pagination: { page: Number(page), per_page: Number(per_page), total: 3, total_pages: 1 }
  });
});

/**
 * GET /users/:id
 * Retrieve a single user by their UUID.
 *
 * @param {string} id - User UUID
 * @header {string} Authorization - Bearer JWT token
 * @returns {object} user - User object
 * @throws {404} User not found
 */
router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  if (id === 'usr_001') {
    return res.json({
      user: {
        id: 'usr_001',
        email: 'alice@example.com',
        name: 'Alice Chen',
        role: 'admin',
        avatar_url: 'https://cdn.example.com/avatars/alice.jpg',
        created_at: '2025-01-15T10:00:00Z',
        last_login: '2026-03-30T08:22:11Z'
      }
    });
  }
  return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
});

/**
 * PUT /users/:id
 * Update a user's profile information.
 *
 * @param {string} id - User UUID
 * @header {string} Authorization - Bearer JWT token (own account or admin)
 * @body {string} [name] - Updated display name
 * @body {string} [email] - Updated email address
 * @body {string} [avatar_url] - Updated avatar URL
 * @returns {object} user - Updated user object
 * @throws {400} Validation error
 * @throws {403} Cannot update another user's account
 * @throws {404} User not found
 */
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { name, email, avatar_url } = req.body;
  return res.json({
    user: {
      id,
      email: email || 'alice@example.com',
      name: name || 'Alice Chen',
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString()
    }
  });
});

/**
 * DELETE /users/:id
 * Deactivate a user account (soft delete). Admin only.
 *
 * @param {string} id - User UUID
 * @header {string} Authorization - Bearer JWT token (admin required)
 * @returns {object} message - Confirmation
 * @throws {403} Admin role required
 * @throws {404} User not found
 */
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  return res.json({ message: `User ${id} has been deactivated`, deactivated_at: new Date().toISOString() });
});

module.exports = router;
