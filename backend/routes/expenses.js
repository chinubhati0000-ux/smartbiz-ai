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
  const expenses = db.getExpensesByBusiness(getBusinessId(req));
  res.json(expenses);
});

router.post('/', (req, res) => {
  const businessId = getBusinessId(req);
  const { category, amount } = req.body;

  if (!category || !amount) {
    return res.status(400).json({ error: 'Category and amount are required' });
  }

  const expense = db.createExpense(businessId, req.body);
  res.status(201).json(expense);
});

router.delete('/:id', (req, res) => {
  const businessId = getBusinessId(req);
  const deleted = db.deleteExpense(req.params.id, businessId);
  if (!deleted) return res.status(404).json({ error: 'Expense not found' });
  res.json({ success: true });
});

module.exports = router;
