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

// Rule-based insight engine. No ML needed for this layer -- clear thresholds
// on real numbers give more trustworthy, explainable output for a shop owner
// than a black-box model would at this data scale.
router.get('/', (req, res) => {
  const businessId = getBusinessId(req);
  const data = db.getAll();

  const products = data.products.filter((p) => p.business_id === businessId);
  const sales = data.sales.filter((s) => s.business_id === businessId);
  const expenses = data.expenses.filter((e) => e.business_id === businessId);
  const productById = Object.fromEntries(products.map((p) => [p.id, p]));

  const insights = [];

  // 1. Month-over-month sales comparison
  const monthMap = {};
  sales.forEach((s) => {
    const m = monthKey(s.sale_date);
    if (!monthMap[m]) monthMap[m] = { revenue: 0, count: 0 };
    monthMap[m].revenue += s.total_amount;
    monthMap[m].count += 1;
  });
  const months = Object.keys(monthMap).sort().reverse();

  if (months.length >= 2) {
    const current = monthMap[months[0]];
    const previous = monthMap[months[1]];
    if (previous.revenue > 0) {
      const pctChange = ((current.revenue - previous.revenue) / previous.revenue) * 100;
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
  const productStats = {};
  sales.forEach((s) => {
    if (!productStats[s.product_id]) productStats[s.product_id] = { units_sold: 0, revenue: 0 };
    productStats[s.product_id].units_sold += s.quantity;
    productStats[s.product_id].revenue += s.total_amount;
  });
  const bestEntry = Object.entries(productStats).sort((a, b) => b[1].revenue - a[1].revenue)[0];
  if (bestEntry) {
    const [pid, stats] = bestEntry;
    const p = productById[pid];
    if (p) {
      insights.push({
        type: 'positive',
        icon: '🔥',
        message: `${p.name} is your best-performing product with ${stats.units_sold} units sold and ₹${stats.revenue.toFixed(2)} in revenue.`
      });
    }
  }

  // 3. Products with declining sales (compare last two months per product)
  products.forEach((p) => {
    const productMonthMap = {};
    sales
      .filter((s) => s.product_id === p.id)
      .forEach((s) => {
        const m = monthKey(s.sale_date);
        productMonthMap[m] = (productMonthMap[m] || 0) + s.quantity;
      });
    const pMonths = Object.keys(productMonthMap).sort().reverse();
    if (pMonths.length >= 2) {
      const currentQty = productMonthMap[pMonths[0]];
      const prevQty = productMonthMap[pMonths[1]];
      if (prevQty > 0 && currentQty < prevQty) {
        insights.push({
          type: 'warning',
          icon: '📉',
          message: `${p.name} sales dropped from ${prevQty} to ${currentQty} units month-over-month.`
        });
      }
    }
  });

  // 4. Low stock warnings
  products
    .filter((p) => p.stock_quantity <= p.low_stock_limit)
    .forEach((p) => {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        message: `${p.name} is running low (${p.stock_quantity} left). Consider restocking soon.`
      });
    });

  // 5. Highest expense category
  const categoryTotals = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    insights.push({
      type: 'neutral',
      icon: '💰',
      message: `Your highest expense category is "${topCategory[0]}" at ₹${topCategory[1].toFixed(2)} total.`
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
});

module.exports = router;
