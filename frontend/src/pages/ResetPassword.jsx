import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Button, ErrorBanner, Input } from '../components/ui';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ledger-paper px-4">
        <div className="w-full max-w-md text-center">
          <p className="text-ledger-ink mb-4">This reset link is missing a token.</p>
          <Link to="/forgot-password" className="text-ledger-teal font-medium">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ledger-paper px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.2em] text-ledger-amber uppercase mb-1">
            Ledger No. 01
          </p>
          <h1 className="font-display text-4xl font-semibold text-ledger-ink">SmartBiz AI</h1>
        </div>

        <div className="bg-white border border-ledger-line rounded-lg p-6">
          {success ? (
            <div className="text-center py-4">
              <p className="text-ledger-teal font-medium mb-2">Password reset successful</p>
              <p className="text-sm text-ledger-ink/60">Redirecting you to log in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <ErrorBanner message={error} />
              <Input
                label="New password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="Confirm new password"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Saving...' : 'Reset password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
