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

    const totalRevenueResult = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales WHERE business_id = $1',
      [businessId]
    );
    const totalRevenue = Number(totalRevenueResult.rows[0].total);

    const totalExpensesResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE business_id = $1',
      [businessId]
    );
    const totalExpenses = Number(totalExpensesResult.rows[0].total);

    const totalSalesResult = await pool.query(
      'SELECT COUNT(*) AS count FROM sales WHERE business_id = $1',
      [businessId]
    );
    const totalSales = Number(totalSalesResult.rows[0].count);

    const totalProductsResult = await pool.query(
      'SELECT COUNT(*) AS count FROM products WHERE business_id = $1',
      [businessId]
    );
    const totalProducts = Number(totalProductsResult.rows[0].count);

    const cogsResult = await pool.query(
      `SELECT COALESCE(SUM(sales.quantity * products.cost_price), 0) AS total
       FROM sales JOIN products ON sales.product_id = products.id
       WHERE sales.business_id = $1`,
      [businessId]
    );
    const cogs = Number(cogsResult.rows[0].total);

    const netProfit = totalRevenue - cogs - totalExpenses;

    const lowStockResult = await pool.query(
      'SELECT * FROM products WHERE business_id = $1 AND stock_quantity <= low_stock_limit',
      [businessId]
    );

    const monthlyRevenueResult = await pool.query(
      `SELECT to_char(sale_date, 'YYYY-MM') AS month, SUM(total_amount) AS revenue
       FROM sales WHERE business_id = $1
       GROUP BY month ORDER BY month DESC LIMIT 6`,
      [businessId]
    );
    const monthlyRevenue = monthlyRevenueResult.rows
      .map((r) => ({ month: r.month, revenue: Number(r.revenue) }))
      .reverse();

    const monthlyExpensesResult = await pool.query(
      `SELECT to_char(expense_date, 'YYYY-MM') AS month, SUM(amount) AS expenses
       FROM expenses WHERE business_id = $1
       GROUP BY month ORDER BY month DESC LIMIT 6`,
      [businessId]
    );
    const monthlyExpenses = monthlyExpensesResult.rows
      .map((r) => ({ month: r.month, expenses: Number(r.expenses) }))
      .reverse();

    const monthlyCogsResult = await pool.query(
      `SELECT to_char(sales.sale_date, 'YYYY-MM') AS month,
              SUM(sales.quantity * products.cost_price) AS cogs
       FROM sales JOIN products ON sales.product_id = products.id
       WHERE sales.business_id = $1
       GROUP BY month`,
      [businessId]
    );

    const monthMap = {};
    monthlyRevenue.forEach((r) => {
      monthMap[r.month] = { month: r.month, revenue: r.revenue, expenses: 0, cogs: 0 };
    });
    monthlyExpenses.forEach((e) => {
      if (!monthMap[e.month]) monthMap[e.month] = { month: e.month, revenue: 0, expenses: 0, cogs: 0 };
      monthMap[e.month].expenses = e.expenses;
    });
    monthlyCogsResult.rows.forEach((c) => {
      if (!monthMap[c.month]) monthMap[c.month] = { month: c.month, revenue: 0, expenses: 0, cogs: 0 };
      monthMap[c.month].cogs = Number(c.cogs);
    });

    const monthlyProfit = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ month: m.month, profit: m.revenue - m.cogs - m.expenses }));

    const topProductsResult = await pool.query(
      `SELECT products.id, products.name, SUM(sales.quantity) AS units_sold, SUM(sales.total_amount) AS revenue
       FROM sales JOIN products ON sales.product_id = products.id
       WHERE sales.business_id = $1
       GROUP BY products.id ORDER BY revenue DESC LIMIT 5`,
      [businessId]
    );
    const topProducts = topProductsResult.rows.map((p) => ({
      id: p.id,
      name: p.name,
      units_sold: Number(p.units_sold),
      revenue: Number(p.revenue)
    }));

    const allProductsResult = await pool.query('SELECT id, name FROM products WHERE business_id = $1', [
      businessId
    ]);
    const soldResult = await pool.query(
      `SELECT products.id, SUM(sales.quantity) AS units_sold, SUM(sales.total_amount) AS revenue
       FROM sales JOIN products ON sales.product_id = products.id
       WHERE sales.business_id = $1 GROUP BY products.id`,
      [businessId]
    );
    const soldMap = {};
    soldResult.rows.forEach((row) => {
      soldMap[row.id] = { units_sold: Number(row.units_sold), revenue: Number(row.revenue) };
    });
    const lowPerforming = allProductsResult.rows
      .map((p) => ({
        id: p.id,
        name: p.name,
        units_sold: soldMap[p.id]?.units_sold || 0,
        revenue: soldMap[p.id]?.revenue || 0
      }))
      .sort((a, b) => a.units_sold - b.units_sold)
      .slice(0, 5);

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      totalSales,
      totalProducts,
      lowStockProducts: lowStockResult.rows,
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit,
      topProducts,
      lowPerforming
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load analytics' });
  }
});

module.exports = router;
