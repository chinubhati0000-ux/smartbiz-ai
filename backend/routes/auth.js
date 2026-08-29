const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function signToken(userId, businessId) {
  return jwt.sign({ userId, businessId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', (req, res) => {
  const { name, email, password, business_name, business_type } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  try {
    const hashed = bcrypt.hashSync(password, 10);
    const user = db.createUser({ name, email, hashedPassword: hashed });
    const business = db.createBusiness({
      userId: user.id,
      business_name: business_name || `${name}'s Business`,
      business_type: business_type || 'General',
      owner_name: name
    });

    const token = signToken(user.id, business.id);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      businessId: business.id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const business = db.findBusinessByUserId(user.id);
  const token = signToken(user.id, business ? business.id : null);

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
    businessId: business ? business.id : null
  });
});

module.exports = router;
