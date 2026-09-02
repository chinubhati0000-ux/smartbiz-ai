const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

async function getBusinessId(userId) {
  const result = await pool.query('SELECT id FROM businesses WHERE user_id = $1', [userId]);
  return result.rows[0] ? result.rows[0].id : null;
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
// trend model.
router.get('/', async (req, res) => {
  try {
    const businessId = await getBusinessId(req.userId);

    const dailySalesResult = await pool.query(
      `SELECT to_char(sale_date, 'YYYY-MM-DD') AS day, SUM(total_amount) AS revenue
       FROM sales WHERE business_id = $1
       GROUP BY day ORDER BY day ASC`,
      [businessId]
    );
    const dailySales = dailySalesResult.rows.map((d) => ({ day: d.day, revenue: Number(d.revenue) }));

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

    const productsResult = await pool.query('SELECT id, name FROM products WHERE business_id = $1', [
      businessId
    ]);

    const productDemand = [];
    for (const p of productsResult.rows) {
      const rowsResult = await pool.query(
        `SELECT to_char(sale_date, 'YYYY-MM-DD') AS day, SUM(quantity) AS qty
         FROM sales WHERE business_id = $1 AND product_id = $2 GROUP BY day ORDER BY day ASC`,
        [businessId, p.id]
      );
      const rows = rowsResult.rows;
      if (rows.length === 0) {
        productDemand.push({ id: p.id, name: p.name, predictedNextWeekUnits: 0 });
        continue;
      }
      const totalQty = rows.reduce((s, r) => s + Number(r.qty), 0);
      const avgDaily = totalQty / rows.length;
      productDemand.push({ id: p.id, name: p.name, predictedNextWeekUnits: Math.round(avgDaily * 7) });
    }

    res.json({
      sufficientData: true,
      trendDirection: b > 0 ? 'up' : b < 0 ? 'down' : 'flat',
      nextWeekRevenue: Number(nextWeekRevenue.toFixed(2)),
      nextMonthRevenue: Number(nextMonthRevenue.toFixed(2)),
      productDemand,
      history: dailySales
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate prediction' });
  }
});

module.exports = router;
