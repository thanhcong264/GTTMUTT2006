import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, TrendingUp, FileText,
  Settings, ChevronDown, ChevronRight, Building2,
  UserCheck, Calculator, Network, Zap, Shield,
  GitBranch, BarChart3, Link2, Menu, X, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
  admin: 'Admin / CEO',
  hr: 'Nhân Sự',
  affiliate_manager: 'Affiliate Manager',
  accountant: 'Kế Toán',
  employee: 'Nhân Viên',
};

const ROLE_COLORS = {
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  hr: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  affiliate_manager: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  accountant: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  employee: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

function NavGroup({ title, children, icon: Icon, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-400 transition-colors"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon size={12} />}
          {title}
        </span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div className="mt-1 space-y-0.5 ml-2 pl-2 border-l border-surface-border/50">{children}</div>}
    </div>
  );
}

function NavItem({ to, icon: Icon, label, badge, requireRoles, active }) {
  const { hasRole, user } = useAuth();
  if (requireRoles && !hasRole(...requireRoles) && user?.role !== 'admin') return null;

  const location = useLocation();
  const isActive = active || location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      <Icon size={16} className="flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="text-xs bg-brand/30 text-brand-light rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-30 flex flex-col
        bg-surface-card border-r border-surface-border
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-border min-h-[64px]">
        {!collapsed && (
          <div className="flex items-center gap-2.5 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-blue-500 flex items-center justify-center shadow-glow">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight">GoClick ERP</p>
              <p className="text-xs text-slate-500">v1.0 • 2024</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-surface-elevated text-slate-400 hover:text-slate-200 transition-colors"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* User Card */}
      {!collapsed && (
        <div className="p-3 border-b border-surface-border animate-fade-in">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-elevated/50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.avatar || user?.full_name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <span className={`badge text-xs border ${ROLE_COLORS[user?.role] || ROLE_COLORS.employee}`}>
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {collapsed ? (
          /* Collapsed icon-only mode */
          <div className="space-y-1">
            {[
              { to: '/dashboard', icon: LayoutDashboard },
              { to: '/attendance', icon: Clock },
              { to: '/affiliates', icon: Network },
              { to: '/workflow', icon: GitBranch },
              { to: '/reports', icon: BarChart3 },
              { to: '/integration', icon: Link2 },
            ].map(({ to, icon: Icon }) => (
              <Link key={to} to={to} className="nav-item justify-center px-2">
                <Icon size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Overview */}
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Tổng quan Dashboard" />

            {/* Phòng Nhân Sự */}
            <NavGroup title="Phòng Nhân Sự" icon={Users}>
              <NavItem
                to="/attendance"
                icon={Clock}
                label="Chấm Công"
                requireRoles={['hr', 'employee', 'affiliate_manager']}
              />
              <NavItem
                to="/employees"
                icon={UserCheck}
                label="Hồ Sơ Nhân Viên"
                requireRoles={['hr']}
              />
              <NavItem
                to="/workflow"
                icon={GitBranch}
                label="Duyệt Đơn / Workflow"
              />
            </NavGroup>

            {/* Phòng Marketing */}
            <NavGroup title="Phòng Marketing">
              <NavItem
                to="/affiliates"
                icon={Network}
                label="Đối Tác Affiliate"
                requireRoles={['affiliate_manager', 'accountant']}
              />
              <NavItem
                to="/affiliates/commission"
                icon={Calculator}
                label="Hoa Hồng"
                requireRoles={['affiliate_manager', 'accountant']}
              />
            </NavGroup>

            {/* Phòng Kế Toán */}
            <NavGroup title="Phòng Kế Toán" icon={Calculator}>
              <NavItem
                to="/payouts"
                icon={FileText}
                label="Duyệt Hoa Hồng"
                requireRoles={['accountant']}
              />
            </NavGroup>

            {/* Báo cáo & Tích hợp */}
            <NavGroup title="Báo Cáo & Tích Hợp" icon={BarChart3}>
              <NavItem to="/reports" icon={BarChart3} label="Báo Cáo Analytics" />
              <NavItem
                to="/integration"
                icon={Link2}
                label="Integration Hub"
                requireRoles={['admin']}
              />
            </NavGroup>

            {/* Cài đặt */}
            <NavGroup title="Hệ Thống" icon={Settings} defaultOpen={false}>
              <NavItem
                to="/settings"
                icon={Settings}
                label="Cài Đặt"
                requireRoles={['admin']}
              />
              <NavItem
                to="/settings/rbac"
                icon={Shield}
                label="Phân Quyền RBAC"
                requireRoles={['admin']}
              />
            </NavGroup>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-surface-border">
        <button
          onClick={logout}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={16} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
