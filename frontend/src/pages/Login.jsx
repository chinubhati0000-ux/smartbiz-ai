import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorBanner, Input } from '../components/ui';
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-ledger-paper px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.2em] text-ledger-amber uppercase mb-1">
            Ledger No. 01
          </p>
          <h1 className="font-display text-4xl font-semibold text-ledger-ink">SmartBiz AI</h1>
          <p className="text-ledger-ink/60 text-sm mt-2">
            The books, the trends, and what to do next — in one place.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-ledger-line rounded-lg p-6">
          <ErrorBanner message={error} />
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
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </Button>
        </form>
        <p className="text-center text-sm mt-2">
          <Link to="/forgot-password" className="text-ledger-teal font-medium">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-ledger-ink/60 mt-4">
          New here?{' '}
          <Link to="/register" className="text-ledger-teal font-medium">
            Create a business account
          </Link>
        </p>
      </div>
    </div>
  );
}
