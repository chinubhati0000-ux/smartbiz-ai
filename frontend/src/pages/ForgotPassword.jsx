import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button, ErrorBanner, Input } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
        </div>

        <div className="bg-white border border-ledger-line rounded-lg p-6">
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-ledger-ink font-medium mb-2">Check your email</p>
              <p className="text-sm text-ledger-ink/60">
                If an account exists for that email, we've sent a link to reset your password.
                It expires in 1 hour.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-ledger-ink/60 mb-4">
                Enter your account email and we'll send you a link to reset your password.
              </p>
              <ErrorBanner message={error} />
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-ledger-ink/60 mt-4">
          <Link to="/login" className="text-ledger-teal font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
