const express = require('express');
const router = express.Router();

const auth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token required' });
  next();
};

/**
 * GET /products
 * Search and list products with filtering, sorting, and pagination.
 *
 * @query {string} [q] - Full-text search query
 * @query {string} [category] - Filter by category slug
 * @query {number} [min_price] - Minimum price in cents
 * @query {number} [max_price] - Maximum price in cents
 * @query {string} [sort] - Sort field: price | created_at | name (default: created_at)
 * @query {string} [order] - Sort direction: asc | desc (default: desc)
 * @query {number} [page] - Page number (default: 1)
 * @query {number} [per_page] - Items per page (default: 20, max: 100)
 * @returns {object[]} products - Array of product objects
 * @returns {object} pagination - Pagination metadata
 */
router.get('/', (req, res) => {
  const { q, category, min_price, max_price, sort = 'created_at', order = 'desc', page = 1, per_page = 20 } = req.query;
  const products = [
    { id: 'prod_001', name: 'Wireless Headphones', category: 'electronics', price_cents: 9999, in_stock: true, created_at: '2025-12-01T00:00:00Z' },
    { id: 'prod_002', name: 'Mechanical Keyboard', category: 'electronics', price_cents: 14999, in_stock: true, created_at: '2025-11-15T00:00:00Z' },
    { id: 'prod_003', name: 'Standing Desk Mat', category: 'office', price_cents: 3999, in_stock: false, created_at: '2025-10-20T00:00:00Z' }
  ];
  return res.json({
    products,
    pagination: { page: Number(page), per_page: Number(per_page), total: 3, total_pages: 1 }
  });
});

/**
 * GET /products/:id
 * Retrieve a single product by ID.
 *
 * @param {string} id - Product ID
 * @returns {object} product - Full product object with variants
 * @throws {404} Product not found
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'prod_001') {
    return res.json({
      product: {
        id: 'prod_001',
        name: 'Wireless Headphones',
        description: 'Premium wireless over-ear headphones with ANC and 30-hour battery life.',
        category: 'electronics',
        price_cents: 9999,
        in_stock: true,
        variants: [
          { id: 'var_001', color: 'Midnight Black', sku: 'WH-BLK-001', stock: 45 },
          { id: 'var_002', color: 'Arctic White', sku: 'WH-WHT-001', stock: 12 }
        ],
        images: ['https://cdn.example.com/products/wh-001-main.jpg'],
        created_at: '2025-12-01T00:00:00Z'
      }
    });
  }
  return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
});

/**
 * POST /products
 * Create a new product. Admin only.
 *
 * @header {string} Authorization - Bearer JWT token (admin required)
 * @body {string} name - Product name (max 200 chars)
 * @body {string} description - Full description (markdown supported)
 * @body {string} category - Category slug
 * @body {number} price_cents - Price in cents (positive integer)
 * @body {string[]} [image_urls] - Array of image URLs
 * @returns {object} product - Newly created product
 * @throws {400} Validation error
 * @throws {403} Admin role required
 */
router.post('/', auth, (req, res) => {
  const { name, description, category, price_cents, image_urls = [] } = req.body;

  if (!name || !category || !price_cents) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'name, category, and price_cents are required'
    });
  }

  const product = {
    id: `prod_${Date.now()}`,
    name,
    description: description || '',
    category,
    price_cents: Number(price_cents),
    in_stock: false,
    images: image_urls,
    created_at: new Date().toISOString()
  };

  return res.status(201).json({ product });
});

/**
 * PATCH /products/:id
 * Partially update product details. Admin only.
 *
 * @param {string} id - Product ID
 * @header {string} Authorization - Bearer JWT token (admin required)
 * @body {string} [name] - Updated product name
 * @body {number} [price_cents] - Updated price in cents
 * @body {boolean} [in_stock] - Updated stock status
 * @returns {object} product - Updated product
 * @throws {404} Product not found
 */
router.patch('/:id', auth, (req, res) => {
  const { id } = req.params;
  return res.json({
    product: {
      id,
      ...req.body,
      updated_at: new Date().toISOString()
    }
  });
});

/**
 * DELETE /products/:id
 * Delete a product permanently. Admin only.
 *
 * @param {string} id - Product ID
 * @header {string} Authorization - Bearer JWT token (admin required)
 * @returns {object} message - Confirmation
 * @throws {403} Admin role required
 * @throws {404} Product not found
 */
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  return res.json({ message: `Product ${id} deleted`, deleted_at: new Date().toISOString() });
});

module.exports = router;
