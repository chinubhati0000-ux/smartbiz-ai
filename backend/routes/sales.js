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
      `SELECT sales.*, products.name AS product_name
       FROM sales JOIN products ON sales.product_id = products.id
       WHERE sales.business_id = $1
       ORDER BY sales.sale_date DESC`,
      [businessId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load sales' });
  }
});

router.post('/', async (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'A valid product and quantity are required' });
  }

  const client = await pool.connect();
  try {
    const businessId = await getBusinessId(req.userId);

    await client.query('BEGIN');

    const productResult = await client.query(
      'SELECT * FROM products WHERE id = $1 AND business_id = $2 FOR UPDATE',
      [product_id, businessId]
    );
    const product = productResult.rows[0];
    if (!product) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock_quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Not enough stock. Only ${product.stock_quantity} units of ${product.name} available.`
      });
    }

    const totalAmount = product.selling_price * Number(quantity);

    const saleResult = await client.query(
      `INSERT INTO sales (business_id, product_id, quantity, total_amount)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [businessId, product_id, quantity, totalAmount]
    );

    await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [
      quantity,
      product_id
    ]);

    await client.query('COMMIT');

    const finalResult = await pool.query(
      `SELECT sales.*, products.name AS product_name
       FROM sales JOIN products ON sales.product_id = products.id
       WHERE sales.id = $1`,
      [saleResult.rows[0].id]
    );

    res.status(201).json(finalResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not record sale' });
  } finally {
    client.release();
  }
});

module.exports = router;
