import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, Card, EmptyState, ErrorBanner, Input, PageHeader, Select } from '../components/ui';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: '', quantity: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([api.get('/sales'), api.get('/products')]).then(([salesRes, productsRes]) => {
      setSales(salesRes.data);
      setProducts(productsRes.data);
      setLoading(false);
    });
  };

  useEffect(loadData, []);

  const selectedProduct = products.find((p) => p.id === Number(form.product_id));
  const previewTotal = selectedProduct ? selectedProduct.selling_price * Number(form.quantity || 0) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/sales', { product_id: Number(form.product_id), quantity: Number(form.quantity) });
      setForm({ product_id: '', quantity: 1 });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record sale.');
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Transactions" title="Sales" />

      <Card className="mb-8">
        <h3 className="font-display text-lg font-semibold mb-4">Record a Sale</h3>
        <ErrorBanner message={error} />
        {products.length === 0 ? (
          <EmptyState message="Add a product first before recording a sale." />
        ) : (
          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-x-4 items-end">
            <Select
              label="Product"
              required
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock_quantity} in stock)
                </option>
              ))}
            </Select>
            <Input
              label="Quantity"
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <div className="mb-4">
              <p className="text-sm text-ledger-ink/60 mb-1">Total amount</p>
              <p className="ledger-number text-xl font-semibold text-ledger-teal">₹{previewTotal.toFixed(2)}</p>
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Record Sale</Button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Sales History</h3>
        {loading ? (
          <p className="text-sm text-ledger-ink/50">Loading...</p>
        ) : sales.length === 0 ? (
          <EmptyState message="No sales recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ledger-ink/50 border-b border-ledger-line">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-ledger-line/60">
                    <td className="py-2 pr-4 font-medium">{s.product_name}</td>
                    <td className="py-2 pr-4 ledger-number">{s.quantity}</td>
                    <td className="py-2 pr-4 ledger-number text-ledger-teal">₹{Number(s.total_amount).toFixed(2)}</td>
                    <td className="py-2 pr-4 text-ledger-ink/60">{new Date(s.sale_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
