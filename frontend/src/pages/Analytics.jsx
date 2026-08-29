import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../services/api';
import { Card, EmptyState, PageHeader } from '../components/ui';

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analytics').then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-ledger-ink/50">Loading analytics...</p>;

  const combined = data.monthlyRevenue.map((r) => {
    const expense = data.monthlyExpenses.find((e) => e.month === r.month);
    return { month: r.month, Revenue: r.revenue, Expenses: expense ? expense.expenses : 0 };
  });

  return (
    <div>
      <PageHeader eyebrow="Deep Dive" title="Analytics" />

      <Card className="mb-8">
        <h3 className="font-display text-lg font-semibold mb-4">Revenue vs Expenses</h3>
        {combined.length === 0 ? (
          <EmptyState message="Add sales and expenses to see this chart." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={combined}>
              <CartesianGrid stroke="#DCD6C7" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => currency(v)} />
              <Legend />
              <Bar dataKey="Revenue" fill="#0F4C46" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#B4442E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-display text-lg font-semibold mb-3">Top-Selling Products</h3>
          {data.topProducts.length === 0 ? (
            <EmptyState message="No sales data yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ledger-ink/50 border-b border-ledger-line">
                  <th className="py-2">Product</th>
                  <th className="py-2">Units</th>
                  <th className="py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p.id} className="border-b border-ledger-line/60">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 ledger-number">{p.units_sold}</td>
                    <td className="py-2 ledger-number text-ledger-teal">{currency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold mb-3">Low-Stock Products</h3>
          {data.lowStockProducts.length === 0 ? (
            <EmptyState message="Everything is well stocked." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ledger-ink/50 border-b border-ledger-line">
                  <th className="py-2">Product</th>
                  <th className="py-2">In Stock</th>
                  <th className="py-2">Limit</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((p) => (
                  <tr key={p.id} className="border-b border-ledger-line/60">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 ledger-number text-ledger-rust">{p.stock_quantity}</td>
                    <td className="py-2 ledger-number text-ledger-ink/60">{p.low_stock_limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
