const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const business = db.findBusinessByUserId(req.userId);
  if (!business) return res.status(404).json({ error: 'Business profile not found' });
  res.json(business);
});

router.put('/', (req, res) => {
  const { business_name, business_type, owner_name, phone, address } = req.body;
  const updated = db.updateBusiness(req.userId, {
    business_name,
    business_type,
    owner_name,
    phone,
    address
  });
  if (!updated) return res.status(404).json({ error: 'Business profile not found' });
  res.json(updated);
});

module.exports = router;
