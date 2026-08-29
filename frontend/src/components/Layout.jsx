import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', tag: 'DB' },
  { to: '/products', label: 'Products', tag: 'PR' },
  { to: '/sales', label: 'Sales', tag: 'SL' },
  { to: '/expenses', label: 'Expenses', tag: 'EX' },
  { to: '/analytics', label: 'Analytics', tag: 'AN' },
  { to: '/insights', label: 'AI Insights', tag: 'AI' },
  { to: '/profile', label: 'Business Profile', tag: 'BP' }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-ledger-paper">
      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 inset-y-0 left-0 w-64 bg-ledger-teal text-ledger-paper flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-6 pt-8 pb-6 border-b border-white/10">
          <p className="font-mono text-xs tracking-[0.2em] text-ledger-amber uppercase">Ledger No. 01</p>
          <h1 className="font-display text-2xl font-semibold mt-1">SmartBiz AI</h1>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium border-l-4 transition-colors ${
                  isActive
                    ? 'bg-white/10 border-ledger-amber text-white'
                    : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="font-mono text-xs text-ledger-amber/80">{item.tag}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-white/10">
          <p className="text-sm text-white/80 truncate">{user?.name}</p>
          <p className="text-xs text-white/50 truncate mb-3">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-sm font-medium bg-white/10 hover:bg-white/20 rounded-md py-2 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-ledger-teal text-white">
          <span className="font-display text-lg font-semibold">SmartBiz AI</span>
          <button onClick={() => setMobileOpen(true)} className="text-2xl leading-none">
            ☰
          </button>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
