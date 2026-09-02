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
      'SELECT * FROM expenses WHERE business_id = $1 ORDER BY expense_date DESC',
      [businessId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load expenses' });
  }
});

router.post('/', async (req, res) => {
  const { category, amount, description, expense_date } = req.body;

  if (!category || !amount) {
    return res.status(400).json({ error: 'Category and amount are required' });
  }

  try {
    const businessId = await getBusinessId(req.userId);
    const result = await pool.query(
      `INSERT INTO expenses (business_id, category, amount, description, expense_date)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP)) RETURNING *`,
      [businessId, category, Number(amount), description || '', expense_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add expense' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const businessId = await getBusinessId(req.userId);
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND business_id = $2',
      [req.params.id, businessId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete expense' });
  }
});

module.exports = router;
