const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

async function getBusinessId(userId) {
  const result = await pool.query('SELECT id FROM businesses WHERE user_id = $1', [userId]);
  return result.rows[0] ? result.rows[0].id : null;
}

router.get('/', async (req, res) => {
  try {
    const businessId = await getBusinessId(req.userId);
    const result = await pool.query(
      'SELECT * FROM products WHERE business_id = $1 ORDER BY created_at DESC',
      [businessId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load products' });
  }
});

router.post('/', async (req, res) => {
  const { name, category, cost_price, selling_price, stock_quantity, low_stock_limit } = req.body;

  if (!name || cost_price == null || selling_price == null) {
    return res.status(400).json({ error: 'Name, cost price, and selling price are required' });
  }

  try {
    const businessId = await getBusinessId(req.userId);
    const result = await pool.query(
      `INSERT INTO products (business_id, name, category, cost_price, selling_price, stock_quantity, low_stock_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        businessId,
        name,
        category || 'General',
        Number(cost_price),
        Number(selling_price),
        Number(stock_quantity) || 0,
        Number(low_stock_limit) || 5
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add product' });
  }
});

router.put('/:id', async (req, res) => {
  const { name, category, cost_price, selling_price, stock_quantity, low_stock_limit } = req.body;

  try {
    const businessId = await getBusinessId(req.userId);
    const existingResult = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND business_id = $2',
      [req.params.id, businessId]
    );
    const existing = existingResult.rows[0];
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const result = await pool.query(
      `UPDATE products SET name = $1, category = $2, cost_price = $3, selling_price = $4, stock_quantity = $5, low_stock_limit = $6
       WHERE id = $7 AND business_id = $8 RETURNING *`,
      [
        name ?? existing.name,
        category ?? existing.category,
        cost_price != null ? Number(cost_price) : existing.cost_price,
        selling_price != null ? Number(selling_price) : existing.selling_price,
        stock_quantity != null ? Number(stock_quantity) : existing.stock_quantity,
        low_stock_limit != null ? Number(low_stock_limit) : existing.low_stock_limit,
        req.params.id,
        businessId
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update product' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const businessId = await getBusinessId(req.userId);
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND business_id = $2',
      [req.params.id, businessId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete product' });
  }
});

module.exports = router;
