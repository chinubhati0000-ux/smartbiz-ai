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
  const sales = db.getSalesByBusiness(getBusinessId(req));
  res.json(sales);
});

router.post('/', (req, res) => {
  const businessId = getBusinessId(req);
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'A valid product and quantity are required' });
  }

  const product = db.getProductById(product_id, businessId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (product.stock_quantity < quantity) {
    return res.status(400).json({
      error: `Not enough stock. Only ${product.stock_quantity} units of ${product.name} available.`
    });
  }

  const totalAmount = product.selling_price * Number(quantity);
  const sale = db.createSale(businessId, product_id, quantity, totalAmount);

  res.status(201).json({ ...sale, product_name: product.name });
});

module.exports = router;
