import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorBanner, Input } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    business_name: '',
    business_type: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ledger-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.2em] text-ledger-amber uppercase mb-1">
            Open a new ledger
          </p>
          <h1 className="font-display text-4xl font-semibold text-ledger-ink">SmartBiz AI</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-ledger-line rounded-lg p-6">
          <ErrorBanner message={error} />
          <Input
            label="Your name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            label="Business name"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          />
          <Input
            label="Business type"
            placeholder="e.g. Grocery, Salon, Bakery"
            value={form.business_type}
            onChange={(e) => setForm({ ...form, business_type: e.target.value })}
          />
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="text-center text-sm text-ledger-ink/60 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-ledger-teal font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
