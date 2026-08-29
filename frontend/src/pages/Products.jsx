import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, Card, EmptyState, ErrorBanner, Input, PageHeader } from '../components/ui';

const emptyForm = { name: '', category: '', cost_price: '', selling_price: '', stock_quantity: '', low_stock_limit: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const loadProducts = () => {
    api.get('/products').then((res) => {
      setProducts(res.data);
      setLoading(false);
    });
  };

  useEffect(loadProducts, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, form);
      } else {
        await api.post('/products', form);
      }
      resetForm();
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save product.');
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      category: p.category,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      stock_quantity: p.stock_quantity,
      low_stock_limit: p.low_stock_limit
    });
    setEditingId(p.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    loadProducts();
  };

  return (
    <div>
      <PageHeader eyebrow="Inventory" title="Products" />

      <Card className="mb-8">
        <h3 className="font-display text-lg font-semibold mb-4">
          {editingId ? 'Edit Product' : 'Add a Product'}
        </h3>
        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-x-4">
          <Input label="Product name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Cost price" type="number" step="0.01" required value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
          <Input label="Selling price" type="number" step="0.01" required value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
          <Input label="Stock quantity" type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
          <Input label="Low stock limit" type="number" value={form.low_stock_limit} onChange={(e) => setForm({ ...form, low_stock_limit: e.target.value })} />
          <div className="flex items-end gap-3 mb-4">
            <Button type="submit">{editingId ? 'Save Changes' : 'Add Product'}</Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">All Products</h3>
        {loading ? (
          <p className="text-ledger-ink/50 text-sm">Loading...</p>
        ) : products.length === 0 ? (
          <EmptyState message="No products yet. Add your first one above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ledger-ink/50 border-b border-ledger-line">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Cost</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Stock</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-ledger-line/60">
                    <td className="py-2 pr-4 font-medium">{p.name}</td>
                    <td className="py-2 pr-4 text-ledger-ink/60">{p.category}</td>
                    <td className="py-2 pr-4 ledger-number">₹{p.cost_price}</td>
                    <td className="py-2 pr-4 ledger-number">₹{p.selling_price}</td>
                    <td className={`py-2 pr-4 ledger-number ${p.stock_quantity <= p.low_stock_limit ? 'text-ledger-rust' : ''}`}>
                      {p.stock_quantity}
                    </td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">
                      <button onClick={() => handleEdit(p)} className="text-ledger-teal text-xs font-medium mr-3">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-ledger-rust text-xs font-medium">
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
