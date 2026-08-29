import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { Card, EmptyState, PageHeader, StatCard } from '../components/ui';

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-ledger-ink/50">Loading dashboard...</p>;
  if (!data) return <EmptyState message="Could not load dashboard data." />;

  const revenueChart = data.monthlyRevenue.map((r) => ({ month: r.month, Revenue: r.revenue }));
  const profitChart = data.monthlyProfit.map((p) => ({ month: p.month, Profit: p.profit }));

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={currency(data.totalRevenue)} tone="positive" />
        <StatCard
          label="Net Profit"
          value={currency(data.netProfit)}
          tone={data.netProfit >= 0 ? 'positive' : 'negative'}
        />
        <StatCard label="Total Sales" value={data.totalSales} />
        <StatCard label="Low Stock Items" value={data.lowStockProducts.length} tone={data.lowStockProducts.length > 0 ? 'negative' : 'neutral'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card>
          <h3 className="font-display text-lg font-semibold mb-4">Monthly Revenue</h3>
          {revenueChart.length === 0 ? (
            <EmptyState message="Record some sales to see revenue trends." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueChart}>
                <CartesianGrid stroke="#DCD6C7" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => currency(v)} />
                <Line type="monotone" dataKey="Revenue" stroke="#0F4C46" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold mb-4">Monthly Profit</h3>
          {profitChart.length === 0 ? (
            <EmptyState message="Add expenses and sales to see profit trends." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={profitChart}>
                <CartesianGrid stroke="#DCD6C7" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => currency(v)} />
                <Bar dataKey="Profit" fill="#C97A2B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <h3 className="font-display text-lg font-semibold mb-3">Top-Selling Products</h3>
          {data.topProducts.length === 0 ? (
            <EmptyState message="No sales yet." />
          ) : (
            <ul className="space-y-2">
              {data.topProducts.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="ledger-number text-ledger-teal">{currency(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold mb-3">Low-Performing Products</h3>
          {data.lowPerforming.length === 0 ? (
            <EmptyState message="No products yet." />
          ) : (
            <ul className="space-y-2">
              {data.lowPerforming.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="ledger-number text-ledger-ink/60">{p.units_sold} sold</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold mb-3">Low-Stock Products</h3>
          {data.lowStockProducts.length === 0 ? (
            <EmptyState message="Everything is well stocked." />
          ) : (
            <ul className="space-y-2">
              {data.lowStockProducts.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="ledger-number text-ledger-rust">{p.stock_quantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
