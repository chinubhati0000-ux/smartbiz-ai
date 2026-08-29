const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function getBusinessId(req) {
  const biz = db.findBusinessByUserId(req.userId);
  return biz ? biz.id : null;
}

function monthKey(isoString) {
  return isoString.slice(0, 7); // "YYYY-MM"
}

router.get('/', (req, res) => {
  const businessId = getBusinessId(req);
  const data = db.getAll();

  const products = data.products.filter((p) => p.business_id === businessId);
  const sales = data.sales.filter((s) => s.business_id === businessId);
  const expenses = data.expenses.filter((e) => e.business_id === businessId);

  const productById = Object.fromEntries(products.map((p) => [p.id, p]));

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cogs = sales.reduce((sum, s) => {
    const p = productById[s.product_id];
    return sum + (p ? p.cost_price * s.quantity : 0);
  }, 0);
  const netProfit = totalRevenue - cogs - totalExpenses;

  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.low_stock_limit);

  // Monthly revenue / expenses / cogs, merged
  const monthMap = {};
  const ensureMonth = (m) => {
    if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, expenses: 0, cogs: 0 };
    return monthMap[m];
  };
  sales.forEach((s) => {
    const m = ensureMonth(monthKey(s.sale_date));
    m.revenue += s.total_amount;
    const p = productById[s.product_id];
    if (p) m.cogs += p.cost_price * s.quantity;
  });
  expenses.forEach((e) => {
    const m = ensureMonth(monthKey(e.expense_date));
    m.expenses += e.amount;
  });

  const sortedMonths = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  const monthlyRevenue = sortedMonths.slice(-6).map((m) => ({ month: m.month, revenue: m.revenue }));
  const monthlyExpenses = sortedMonths
    .slice(-6)
    .map((m) => ({ month: m.month, expenses: m.expenses }));
  const monthlyProfit = sortedMonths
    .slice(-6)
    .map((m) => ({ month: m.month, profit: m.revenue - m.cogs - m.expenses }));

  // Top-selling products by revenue
  const productStats = {};
  sales.forEach((s) => {
    if (!productStats[s.product_id]) {
      productStats[s.product_id] = { units_sold: 0, revenue: 0 };
    }
    productStats[s.product_id].units_sold += s.quantity;
    productStats[s.product_id].revenue += s.total_amount;
  });

  const topProducts = Object.entries(productStats)
    .map(([id, stats]) => ({
      id: Number(id),
      name: productById[id] ? productById[id].name : 'Unknown',
      ...stats
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const lowPerforming = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      units_sold: productStats[p.id]?.units_sold || 0,
      revenue: productStats[p.id]?.revenue || 0
    }))
    .sort((a, b) => a.units_sold - b.units_sold)
    .slice(0, 5);

  res.json({
    totalRevenue,
    totalExpenses,
    netProfit,
    totalSales: sales.length,
    totalProducts: products.length,
    lowStockProducts,
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit,
    topProducts,
    lowPerforming
  });
});

module.exports = router;
