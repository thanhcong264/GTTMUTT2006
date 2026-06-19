import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'admin@goclick.vn', password: 'admin123', role: 'Admin/CEO', color: 'from-purple-600 to-indigo-600' },
  { email: 'hr@goclick.vn', password: 'hr123', role: 'Nhân Sự', color: 'from-blue-600 to-cyan-600' },
  { email: 'am@goclick.vn', password: 'am123', role: 'Affiliate Mgr', color: 'from-emerald-600 to-teal-600' },
  { email: 'accountant@goclick.vn', password: 'acc123', role: 'Kế Toán', color: 'from-amber-600 to-orange-600' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@goclick.vn');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng nhập thất bại. Kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-blue-500 shadow-glow mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">GoClick ERP</h1>
          <p className="text-slate-400 mt-1 text-sm">Tiếp thị Liên kết & Chấm công</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-2 mb-6">
            <Shield size={16} className="text-brand" />
            <span className="text-sm font-semibold text-slate-300">Đăng nhập hệ thống</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="email@goclick.vn"
                required
              />
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg w-full justify-center mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="mt-4 glass-card p-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <p className="text-xs text-slate-500 mb-3 text-center font-medium">⚡ Tài khoản Demo – Chọn để đăng nhập nhanh</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => { quickLogin(acc); }}
                className="text-left p-2.5 rounded-xl border border-surface-border hover:border-brand/30 bg-surface-elevated/50 hover:bg-surface-elevated transition-all group"
              >
                <div className={`text-xs font-bold bg-gradient-to-r ${acc.color} bg-clip-text text-transparent`}>
                  {acc.role}
                </div>
                <div className="text-xs text-slate-500 truncate">{acc.email.split('@')[0]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
