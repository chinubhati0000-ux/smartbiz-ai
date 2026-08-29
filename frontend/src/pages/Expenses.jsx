import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, Card, EmptyState, ErrorBanner, Input, PageHeader, Select } from '../components/ui';

const CATEGORIES = ['Rent', 'Electricity', 'Salary', 'Transport', 'Product Purchase', 'Other'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ category: 'Rent', amount: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadExpenses = () => {
    api.get('/expenses').then((res) => {
      setExpenses(res.data);
      setLoading(false);
    });
  };

  useEffect(loadExpenses, []);

  const monthlyTotal = expenses
    .filter((e) => new Date(e.expense_date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/expenses', form);
      setForm({ category: 'Rent', amount: '', description: '' });
      loadExpenses();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save expense.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    loadExpenses();
  };

  return (
    <div>
      <PageHeader eyebrow="Outgoings" title="Expenses" />

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="font-mono text-xs tracking-widest text-ledger-ink/50 uppercase mb-2">This Month</p>
          <p className="ledger-number text-3xl font-semibold text-ledger-rust">₹{monthlyTotal.toFixed(2)}</p>
        </Card>
        <Card className="md:col-span-2">
          <h3 className="font-display text-lg font-semibold mb-4">Add an Expense</h3>
          <ErrorBanner message={error} />
          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-x-4 items-end">
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input
              label="Amount"
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <Input
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="md:col-span-3">
              <Button type="submit">Add Expense</Button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Expense History</h3>
        {loading ? (
          <p className="text-sm text-ledger-ink/50">Loading...</p>
        ) : expenses.length === 0 ? (
          <EmptyState message="No expenses recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ledger-ink/50 border-b border-ledger-line">
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((ex) => (
                  <tr key={ex.id} className="border-b border-ledger-line/60">
                    <td className="py-2 pr-4 font-medium">{ex.category}</td>
                    <td className="py-2 pr-4 ledger-number text-ledger-rust">₹{ex.amount.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-ledger-ink/60">{ex.description || '—'}</td>
                    <td className="py-2 pr-4 text-ledger-ink/60">{new Date(ex.expense_date).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-right">
                      <button onClick={() => handleDelete(ex.id)} className="text-ledger-rust text-xs font-medium">
                        Delete
                      </button>
                    </td>
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
