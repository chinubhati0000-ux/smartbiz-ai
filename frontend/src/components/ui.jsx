import React from 'react';

export function PageHeader({ eyebrow, title, action }) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        {eyebrow && (
          <p className="font-mono text-xs tracking-[0.2em] text-ledger-amber uppercase mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-3xl font-semibold text-ledger-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-ledger-line rounded-lg p-5 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, tone = 'neutral' }) {
  const toneClass =
    tone === 'positive'
      ? 'text-ledger-teal'
      : tone === 'negative'
      ? 'text-ledger-rust'
      : 'text-ledger-ink';
  return (
    <Card>
      <p className="font-mono text-xs tracking-widest text-ledger-ink/50 uppercase mb-2">
        {label}
      </p>
      <p className={`ledger-number text-3xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-ledger-teal text-white hover:bg-ledger-tealLight',
    secondary: 'bg-white border border-ledger-line text-ledger-ink hover:bg-ledger-paper',
    danger: 'bg-white border border-ledger-rust text-ledger-rust hover:bg-ledger-rust hover:text-white'
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block mb-4">
      {label && <span className="block text-sm font-medium text-ledger-ink mb-1">{label}</span>}
      <input
        className={`w-full border border-ledger-line rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ledger-teal/40 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block mb-4">
      {label && <span className="block text-sm font-medium text-ledger-ink mb-1">{label}</span>}
      <select
        className={`w-full border border-ledger-line rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ledger-teal/40 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="bg-ledger-rust/10 border border-ledger-rust/30 text-ledger-rust text-sm rounded-md px-4 py-3 mb-4">
      {message}
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div className="text-center py-12 text-ledger-ink/50 text-sm border border-dashed border-ledger-line rounded-lg">
      {message}
    </div>
  );
}
