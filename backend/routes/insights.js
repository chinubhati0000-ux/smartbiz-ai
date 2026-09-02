const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

async function getBusinessId(userId) {
  const result = await pool.query('SELECT id FROM businesses WHERE user_id = $1', [userId]);
  return result.rows[0] ? result.rows[0].id : null;
}

router.get('/', async (req, res) => {
  try {
    const businessId = await getBusinessId(req.userId);
    const insights = [];

    // 1. Month-over-month sales comparison
    const monthlySalesResult = await pool.query(
      `SELECT to_char(sale_date, 'YYYY-MM') AS month, SUM(total_amount) AS revenue
       FROM sales WHERE business_id = $1 GROUP BY month ORDER BY month DESC LIMIT 2`,
      [businessId]
    );
    const monthlySales = monthlySalesResult.rows;

    if (monthlySales.length === 2) {
      const current = Number(monthlySales[0].revenue);
      const previous = Number(monthlySales[1].revenue);
      if (previous > 0) {
        const pctChange = ((current - previous) / previous) * 100;
        if (pctChange > 0) {
          insights.push({
            type: 'positive',
            icon: '📈',
            message: `Sales are up ${pctChange.toFixed(1)}% compared to last month. Keep it up!`
          });
        } else if (pctChange < 0) {
          insights.push({
            type: 'warning',
            icon: '📉',
            message: `Sales dropped ${Math.abs(pctChange).toFixed(1)}% compared to last month. Worth investigating.`
          });
        } else {
          insights.push({ type: 'neutral', icon: '➡️', message: 'Sales are flat compared to last month.' });
        }
      }
    } else {
      insights.push({
        type: 'neutral',
        icon: 'ℹ️',
        message: 'Not enough monthly history yet to compare sales trends. Keep recording sales.'
      });
    }

    // 2. Best-selling product
    const bestProductResult = await pool.query(
      `SELECT products.name, SUM(sales.quantity) AS units_sold, SUM(sales.total_amount) AS revenue
       FROM sales JOIN products ON sales.product_id = products.id
       WHERE sales.business_id = $1 GROUP BY products.id ORDER BY revenue DESC LIMIT 1`,
      [businessId]
    );
    if (bestProductResult.rows[0]) {
      const bp = bestProductResult.rows[0];
      insights.push({
        type: 'positive',
        icon: '🔥',
        message: `${bp.name} is your best-performing product with ${bp.units_sold} units sold and ₹${Number(bp.revenue).toFixed(2)} in revenue.`
      });
    }

    // 3. Products with declining sales (compare last two months per product)
    const productsResult = await pool.query('SELECT id, name FROM products WHERE business_id = $1', [
      businessId
    ]);
    for (const p of productsResult.rows) {
      const rowsResult = await pool.query(
        `SELECT to_char(sale_date, 'YYYY-MM') AS month, SUM(quantity) AS qty
         FROM sales WHERE business_id = $1 AND product_id = $2
         GROUP BY month ORDER BY month DESC LIMIT 2`,
        [businessId, p.id]
      );
      const rows = rowsResult.rows;
      if (rows.length === 2) {
        const currentQty = Number(rows[0].qty);
        const prevQty = Number(rows[1].qty);
        if (prevQty > 0 && currentQty < prevQty) {
          insights.push({
            type: 'warning',
            icon: '📉',
            message: `${p.name} sales dropped from ${prevQty} to ${currentQty} units month-over-month.`
          });
        }
      }
    }

    // 4. Low stock warnings
    const lowStockResult = await pool.query(
      'SELECT * FROM products WHERE business_id = $1 AND stock_quantity <= low_stock_limit',
      [businessId]
    );
    lowStockResult.rows.forEach((p) => {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        message: `${p.name} is running low (${p.stock_quantity} left). Consider restocking soon.`
      });
    });

    // 5. Highest expense category
    const topExpenseResult = await pool.query(
      `SELECT category, SUM(amount) AS total FROM expenses WHERE business_id = $1
       GROUP BY category ORDER BY total DESC LIMIT 1`,
      [businessId]
    );
    if (topExpenseResult.rows[0]) {
      const te = topExpenseResult.rows[0];
      insights.push({
        type: 'neutral',
        icon: '💰',
        message: `Your highest expense category is "${te.category}" at ₹${Number(te.total).toFixed(2)} total.`
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'neutral',
        icon: 'ℹ️',
        message: 'Add some sales and expenses to start seeing AI insights about your business.'
      });
    }

    res.json({ insights });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate insights' });
  }
});

module.exports = router;
