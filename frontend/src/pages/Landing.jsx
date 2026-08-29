import React from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { tag: 'PR', title: 'Products & Inventory', desc: 'Track stock, cost, and price for everything you sell.' },
  { tag: 'SL', title: 'Sales', desc: 'Log a sale in seconds — stock and totals update themselves.' },
  { tag: 'EX', title: 'Expenses', desc: 'Rent, salaries, transport — categorized and totaled monthly.' },
  { tag: 'AI', title: 'AI Insights', desc: 'Plain-language notes on what changed and what needs attention.' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ledger-paper">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display text-xl font-semibold text-ledger-ink">SmartBiz AI</span>
        <div className="flex gap-3">
          <Link to="/login" className="text-sm font-medium text-ledger-ink px-4 py-2">
            Log in
          </Link>
          <Link to="/register" className="text-sm font-medium bg-ledger-teal text-white px-4 py-2 rounded-md">
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-ledger-amber uppercase mb-4">
          One ledger. Every number.
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold text-ledger-ink leading-tight max-w-3xl mx-auto">
          Run your shop's books without the spreadsheet headache.
        </h1>
        <p className="text-ledger-ink/60 mt-6 max-w-xl mx-auto">
          Products, sales, expenses, and profit — recorded once, understood instantly.
          SmartBiz AI turns your daily entries into insights a busy owner can act on.
        </p>
        <Link
          to="/register"
          className="inline-block mt-8 bg-ledger-teal text-white font-medium px-6 py-3 rounded-md hover:bg-ledger-tealLight transition-colors"
        >
          Open your ledger — it's free
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-4 gap-5">
        {FEATURES.map((f) => (
          <div key={f.tag} className="bg-white border border-ledger-line rounded-lg p-5">
            <span className="font-mono text-xs text-ledger-amber">{f.tag}</span>
            <h3 className="font-display text-lg font-semibold text-ledger-ink mt-2 mb-1">{f.title}</h3>
            <p className="text-sm text-ledger-ink/60">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
