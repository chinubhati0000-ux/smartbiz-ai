const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../db');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

function signToken(userId, businessId) {
  return jwt.sign({ userId, businessId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  const { name, email, password, business_name, business_type } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userResult = await client.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
        [name, normalizedEmail, hashed]
      );
      const userId = userResult.rows[0].id;

      const bizResult = await client.query(
        `INSERT INTO businesses (user_id, business_name, business_type, owner_name)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [userId, business_name || `${name}'s Business`, business_type || 'General', name]
      );
      const businessId = bizResult.rows[0].id;

      await client.query('COMMIT');

      const token = signToken(userId, businessId);
      res.status(201).json({
        token,
        user: { id: userId, name, email: normalizedEmail },
        businessId
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const bizResult = await pool.query('SELECT id FROM businesses WHERE user_id = $1', [user.id]);
    const business = bizResult.rows[0];
    const token = signToken(user.id, business ? business.id : null);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      businessId: business ? business.id : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const genericResponse = {
    message: 'If an account exists for that email, a password reset link has been sent.'
  };

  try {
    const normalizedEmail = email.toLowerCase();
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    const user = userResult.rows[0];

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [
        token,
        expires,
        user.id
      ]);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail(normalizedEmail, resetUrl);
      } catch (emailErr) {
        console.error('Failed to send password reset email:', emailErr);
      }
    }

    res.json(genericResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    );
    const user = userResult.rows[0];

    if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashed, user.id]
    );

    res.json({ message: 'Your password has been reset. You can now log in with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
