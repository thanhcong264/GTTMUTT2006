import React, { useState } from 'react';
import { Bell, Search, Sun, Moon, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
  admin: 'Admin / CEO',
  hr: 'Nhân Sự',
  affiliate_manager: 'Affiliate Manager',
  accountant: 'Kế Toán',
  employee: 'Nhân Viên',
};

export default function Header({ title, subtitle }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <header className="sticky top-0 z-20 bg-surface-card/80 backdrop-blur-sm border-b border-surface-border px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2 border border-surface-border w-64">
        <Search size={14} className="text-slate-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Date/Time */}
        <div className="hidden lg:block text-right">
          <p className="text-xs font-semibold text-slate-300">{timeStr}</p>
          <p className="text-xs text-slate-500">{dateStr}</p>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-surface-elevated text-slate-400 hover:text-slate-200 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-surface-elevated transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              {user?.avatar || user?.full_name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-white leading-tight">{user?.full_name?.split(' ').pop()}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role]}</p>
            </div>
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 card shadow-xl border border-surface-border z-50 animate-slide-up py-1">
              <div className="px-4 py-2 border-b border-surface-border">
                <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
