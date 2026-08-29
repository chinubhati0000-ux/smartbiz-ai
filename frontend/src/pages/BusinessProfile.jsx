import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, Card, ErrorBanner, Input, PageHeader } from '../components/ui';

export default function BusinessProfile() {
  const [form, setForm] = useState({
    business_name: '',
    business_type: '',
    owner_name: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/business').then((res) => {
      setForm({
        business_name: res.data.business_name || '',
        business_type: res.data.business_type || '',
        owner_name: res.data.owner_name || '',
        phone: res.data.phone || '',
        address: res.data.address || ''
      });
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      await api.put('/business', form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save business profile.');
    }
  };

  if (loading) return <p className="text-ledger-ink/50">Loading...</p>;

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Business Profile" />
      <Card className="max-w-xl">
        <ErrorBanner message={error} />
        {saved && (
          <div className="bg-ledger-teal/10 border border-ledger-teal/30 text-ledger-teal text-sm rounded-md px-4 py-3 mb-4">
            Business profile saved.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <Input
            label="Business name"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          />
          <Input
            label="Business type"
            value={form.business_type}
            onChange={(e) => setForm({ ...form, business_type: e.target.value })}
          />
          <Input
            label="Owner name"
            value={form.owner_name}
            onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Button type="submit">Save Changes</Button>
        </form>
      </Card>
    </div>
  );
}
