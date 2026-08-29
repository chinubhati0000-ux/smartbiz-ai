const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function getBusinessId(req) {
  const biz = db.findBusinessByUserId(req.userId);
  return biz ? biz.id : null;
}

function dayKey(isoString) {
  return isoString.slice(0, 10); // "YYYY-MM-DD"
}

// Simple linear regression: y = a + b*x, fit with least squares.
function linearRegression(points) {
  const n = points.length;
  if (n === 0) return { a: 0, b: 0 };
  if (n === 1) return { a: points[0].y, b: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { a: sumY / n, b: 0 };

  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  return { a, b };
}

// GET /predict -> predicts next week's total sales and next month's revenue
// based on historical daily sales, using linear regression as a simple
// trend model. Needs at least a few days of history to produce a
// meaningful trend rather than a flat guess.
router.get('/', (req, res) => {
  const businessId = getBusinessId(req);
  const data = db.getAll();

  const products = data.products.filter((p) => p.business_id === businessId);
  const sales = data.sales.filter((s) => s.business_id === businessId);

  const dailyMap = {};
  sales.forEach((s) => {
    const d = dayKey(s.sale_date);
    dailyMap[d] = (dailyMap[d] || 0) + s.total_amount;
  });
  const dailySales = Object.keys(dailyMap)
    .sort()
    .map((day) => ({ day, revenue: dailyMap[day] }));

  if (dailySales.length < 3) {
    return res.json({
      sufficientData: false,
      message: 'Record at least a few days of sales to unlock predictions.',
      nextWeekRevenue: null,
      nextMonthRevenue: null,
      history: dailySales
    });
  }

  const points = dailySales.map((d, i) => ({ x: i, y: d.revenue }));
  const { a, b } = linearRegression(points);

  const lastX = points[points.length - 1].x;
  const predictDay = (offset) => Math.max(0, a + b * (lastX + offset));

  let nextWeekRevenue = 0;
  for (let i = 1; i <= 7; i++) nextWeekRevenue += predictDay(i);

  let nextMonthRevenue = 0;
  for (let i = 1; i <= 30; i++) nextMonthRevenue += predictDay(i);

  // Per-product demand prediction: average daily units over history, projected forward
  const productDemand = products.map((p) => {
    const productDailyMap = {};
    sales
      .filter((s) => s.product_id === p.id)
      .forEach((s) => {
        const d = dayKey(s.sale_date);
        productDailyMap[d] = (productDailyMap[d] || 0) + s.quantity;
      });
    const dayCount = Object.keys(productDailyMap).length;
    if (dayCount === 0) return { id: p.id, name: p.name, predictedNextWeekUnits: 0 };
    const totalQty = Object.values(productDailyMap).reduce((s, v) => s + v, 0);
    const avgDaily = totalQty / dayCount;
    return { id: p.id, name: p.name, predictedNextWeekUnits: Math.round(avgDaily * 7) };
  });

  res.json({
    sufficientData: true,
    trendDirection: b > 0 ? 'up' : b < 0 ? 'down' : 'flat',
    nextWeekRevenue: Number(nextWeekRevenue.toFixed(2)),
    nextMonthRevenue: Number(nextMonthRevenue.toFixed(2)),
    productDemand,
    history: dailySales
  });
});

module.exports = router;
