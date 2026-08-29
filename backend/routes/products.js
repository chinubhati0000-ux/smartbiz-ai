const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function getBusinessId(req) {
  const biz = db.findBusinessByUserId(req.userId);
  return biz ? biz.id : null;
}

router.get('/', (req, res) => {
  const products = db.getProductsByBusiness(getBusinessId(req));
  res.json(products);
});

router.post('/', (req, res) => {
  const businessId = getBusinessId(req);
  const { name, cost_price, selling_price } = req.body;

  if (!name || cost_price == null || selling_price == null) {
    return res.status(400).json({ error: 'Name, cost price, and selling price are required' });
  }

  const product = db.createProduct(businessId, req.body);
  res.status(201).json(product);
});

router.put('/:id', (req, res) => {
  const businessId = getBusinessId(req);
  const updated = db.updateProduct(req.params.id, businessId, req.body);
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const businessId = getBusinessId(req);
  const deleted = db.deleteProduct(req.params.id, businessId);
  if (!deleted) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true });
});

module.exports = router;
