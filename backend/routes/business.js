const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM businesses WHERE user_id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Business profile not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load business profile' });
  }
});

router.put('/', async (req, res) => {
  const { business_name, business_type, owner_name, phone, address } = req.body;
  try {
    await pool.query(
      `UPDATE businesses SET business_name = $1, business_type = $2, owner_name = $3, phone = $4, address = $5
       WHERE user_id = $6`,
      [business_name, business_type, owner_name, phone, address, req.userId]
    );
    const result = await pool.query('SELECT * FROM businesses WHERE user_id = $1', [req.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update business profile' });
  }
});

module.exports = router;
