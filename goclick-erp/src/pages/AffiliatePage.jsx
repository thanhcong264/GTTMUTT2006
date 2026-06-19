import React, { useEffect, useState } from 'react';
import {
  Network, Plus, Search, Filter, ExternalLink, CheckCircle,
  XCircle, Clock, TrendingUp, Calculator, Loader2, X,
  ChevronUp, ChevronDown, RefreshCw, Zap, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const STATUS_STYLES = {
  active:     { cls: 'badge-success', label: 'Active' },
  pending:    { cls: 'badge-warning', label: 'Pending' },
  suspended:  { cls: 'badge-danger', label: 'Suspended' },
  terminated: { cls: 'badge-neutral', label: 'Terminated' },
};

const SOURCE_COLORS = {
  'SEO / Blog': 'text-green-400',
  'Facebook Ads': 'text-blue-400',
  'TikTok': 'text-pink-400',
  'YouTube': 'text-red-400',
  'Email Marketing': 'text-amber-400',
  'Default': 'text-slate-400',
};

function AddAffiliateModal({ onClose, onSuccess }) {
  const { api } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', traffic_source: 'SEO / Blog', tier_level: 1 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/affiliates', form);
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md mx-4 p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">Thêm đối tác Affiliate</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tên đối tác *</label>
            <input value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})}
              className="input" required placeholder="Công ty / Cá nhân" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="input" placeholder="email@domain.com" />
            </div>
            <div>
              <label className="label">Điện thoại</label>
              <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                className="input" placeholder="09xxxxxxxx" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nguồn Traffic</label>
              <select value={form.traffic_source} onChange={(e) => setForm({...form, traffic_source: e.target.value})}
                className="input">
                {['SEO / Blog', 'Facebook Ads', 'TikTok', 'YouTube', 'Email Marketing', 'Google Ads', 'Khác'].map(s =>
                  <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cấp</label>
              <select value={form.tier_level} onChange={(e) => setForm({...form, tier_level: Number(e.target.value)})}
                className="input">
                <option value={1}>Cấp 1 (10%)</option>
                <option value={2}>Cấp 2 (3%)</option>
                <option value={3}>Cấp 3 (1%)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Huỷ</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Thêm đối tác
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CommissionPanel({ config, onUpdate }) {
  const { api } = useAuth();
  const [editing, setEditing] = useState(null);
  const [rate, setRate] = useState('');

  const handleSave = async (tier) => {
    try {
      await api.put('/affiliates/config/commission', { tier_level: tier, rate_percent: parseFloat(rate) });
      onUpdate?.();
      setEditing(null);
    } catch (e) {
      alert(e.response?.data?.detail || 'Lỗi');
    }
  };

  return (
    <div className="card p-5">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Calculator size={18} className="text-brand" />
        Cấu hình Hoa hồng Đa cấp
      </h3>
      <div className="space-y-3">
        {config.map((cfg) => (
          <div key={cfg.tier_level} className="flex items-center gap-4 p-3.5 rounded-xl bg-surface-elevated/50 border border-surface-border/50">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              cfg.tier_level === 1 ? 'bg-brand/20 text-brand-light border border-brand/30' :
              cfg.tier_level === 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              L{cfg.tier_level}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">{cfg.name}</p>
              <p className="text-xs text-slate-500">
                {cfg.tier_level === 1 ? 'Đối tác trực tiếp' :
                 cfg.tier_level === 2 ? 'Đối tác cấp dưới của L1' : 'Đối tác cấp dưới của L2'}
              </p>
            </div>
            {editing === cfg.tier_level ? (
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.1" value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="input w-20 text-center py-1.5"
                />
                <span className="text-slate-400">%</span>
                <button onClick={() => handleSave(cfg.tier_level)} className="btn-success btn-sm">✓</button>
                <button onClick={() => setEditing(null)} className="btn-secondary btn-sm">✗</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-emerald-400">{cfg.rate_percent}%</span>
                <button
                  onClick={() => { setEditing(cfg.tier_level); setRate(cfg.rate_percent); }}
                  className="btn-ghost btn-sm"
                >
                  Sửa
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-brand/10 border border-brand/20 rounded-xl text-xs text-slate-400">
        💡 <strong className="text-brand-light">Ví dụ:</strong> Đối tác L1 bán được 1,000,000đ → nhận 100,000đ (10%). Nếu có đối tác L2 trong nhóm bán được 500,000đ → L2 nhận 15,000đ (3%), L1 nhận thêm 15,000đ bonus.
      </div>
    </div>
  );
}

export default function AffiliatePage() {
  const { api } = useAuth();
  const [affiliates, setAffiliates] = useState([]);
  const [config, setConfig] = useState([]);
  const [postbackLogs, setPostbackLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [sortField, setSortField] = useState('total_revenue');
  const [sortDir, setSortDir] = useState('desc');

  const load = async () => {
    setLoading(true);
    try {
      const [affRes, cfgRes, logRes] = await Promise.all([
        api.get('/affiliates' + (statusFilter ? `?status=${statusFilter}` : '') + (search ? `${statusFilter ? '&' : '?'}search=${search}` : '')),
        api.get('/affiliates/config/commission'),
        api.get('/affiliates/postback/logs'),
      ]);
      setAffiliates(affRes.data.affiliates || []);
      setConfig(cfgRes.data.config || []);
      setPostbackLogs(logRes.data.logs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const runCalc = async () => {
    setCalcLoading(true);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
    try {
      const res = await api.post('/affiliates/calculate-commission', { period_from: from, period_to: to });
      setCalcResult(res.data);
    } finally {
      setCalcLoading(false);
    }
  };

  const sorted = [...affiliates].sort((a, b) => {
    const va = a[sortField] ?? 0, vb = b[sortField] ?? 0;
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const formatVND = (v) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(v) + 'đ';

  return (
    <Layout title="Quản lý Affiliate" subtitle="Danh sách đối tác, cấu hình hoa hồng & postback tracking">
      {showAdd && <AddAffiliateModal onClose={() => setShowAdd(false)} onSuccess={load} />}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-card rounded-xl border border-surface-border mb-5 w-fit">
        {[
          { id: 'list', label: 'Danh sách đối tác', icon: Network },
          { id: 'commission', label: 'Hoa hồng', icon: Calculator },
          { id: 'postback', label: 'Postback Log', icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-brand text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* TAB: Affiliate List */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-surface-card rounded-xl px-3 py-2 border border-surface-border flex-1 max-w-xs">
              <Search size={14} className="text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none w-full"
                placeholder="Tìm đối tác..." />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto py-2 px-3 min-w-[140px]">
              <option value="">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={16} /> Thêm đối tác
            </button>
          </div>

          {/* Stats mini */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Tổng đối tác', val: affiliates.length, color: 'text-white' },
              { label: 'Active', val: affiliates.filter(a => a.status === 'active').length, color: 'text-emerald-400' },
              { label: 'Tổng doanh thu', val: formatVND(affiliates.reduce((s, a) => s + a.total_revenue, 0)), color: 'text-blue-400' },
              { label: 'Tổng hoa hồng', val: formatVND(affiliates.reduce((s, a) => s + a.total_commission, 0)), color: 'text-amber-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="card p-3.5 text-center">
                <p className={`text-xl font-black ${color}`}>{val}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card">
            {loading ? (
              <div className="p-6 space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã / Tên</th>
                      <th>Cấp</th>
                      <th>Nguồn Traffic</th>
                      <th className="cursor-pointer hover:text-white" onClick={() => toggleSort('total_clicks')}>
                        <span className="flex items-center gap-1">Clicks <SortIcon field="total_clicks" /></span>
                      </th>
                      <th className="cursor-pointer hover:text-white" onClick={() => toggleSort('total_conversions')}>
                        <span className="flex items-center gap-1">Đơn <SortIcon field="total_conversions" /></span>
                      </th>
                      <th>CR%</th>
                      <th className="cursor-pointer hover:text-white" onClick={() => toggleSort('total_revenue')}>
                        <span className="flex items-center gap-1">Doanh thu <SortIcon field="total_revenue" /></span>
                      </th>
                      <th>Hoa hồng</th>
                      <th>Trạng thái</th>
                      <th>Quản lý</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((aff) => {
                      const st = STATUS_STYLES[aff.status] || STATUS_STYLES.pending;
                      const srcColor = SOURCE_COLORS[aff.traffic_source] || SOURCE_COLORS.Default;
                      return (
                        <tr key={aff.id}>
                          <td>
                            <div>
                              <p className="font-mono text-xs text-brand-light">{aff.affiliate_code}</p>
                              <p className="font-semibold text-sm text-white">{aff.full_name}</p>
                              <p className="text-xs text-slate-500">{aff.email}</p>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${aff.tier_level === 1 ? 'badge-info' : aff.tier_level === 2 ? 'badge-success' : 'badge-warning'}`}>
                              L{aff.tier_level}
                            </span>
                          </td>
                          <td className={`text-sm ${srcColor}`}>{aff.traffic_source}</td>
                          <td className="font-mono font-semibold">{aff.total_clicks?.toLocaleString()}</td>
                          <td className="font-mono font-semibold">{aff.total_conversions?.toLocaleString()}</td>
                          <td className="font-semibold text-emerald-400">{aff.conversion_rate}%</td>
                          <td className="font-bold text-blue-400">{formatVND(aff.total_revenue)}</td>
                          <td className="font-bold text-amber-400">{formatVND(aff.total_commission)}</td>
                          <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <td className="text-xs text-slate-500">{aff.manager_name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Commission */}
      {activeTab === 'commission' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <CommissionPanel config={config} onUpdate={load} />

          <div className="card p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={18} className="text-brand" /> Tính hoa hồng kỳ trước
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Chạy bộ tính hoa hồng tự động cho tất cả đối tác active trong kỳ vừa rồi.
            </p>
            <button onClick={runCalc} disabled={calcLoading} className="btn-primary w-full justify-center mb-4">
              {calcLoading ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
              {calcLoading ? 'Đang tính...' : 'Chạy tính hoa hồng tháng trước'}
            </button>

            {calcResult?.report && (
              <div className="space-y-3 animate-slide-up">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl text-center">
                    <p className="text-lg font-black text-brand-light">
                      {formatVND(calcResult.report.summary.total_commission)}
                    </p>
                    <p className="text-xs text-slate-500">Tổng hoa hồng</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <p className="text-lg font-black text-emerald-400">
                      {calcResult.report.summary.total_affiliates}
                    </p>
                    <p className="text-xs text-slate-500">Đối tác được hưởng</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {calcResult.report.payouts?.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated/50 text-sm">
                      <div>
                        <p className="font-medium text-white">{p.affiliate_name}</p>
                        <p className="text-xs text-slate-500">{p.total_conversions} đơn • CR {p.commission_rate}%</p>
                      </div>
                      <p className="font-bold text-amber-400">{formatVND(p.net_payable)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Postback Log */}
      {activeTab === 'postback' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-brand" /> Postback / Tracking Log
            </h3>
            <button onClick={load} className="btn-ghost btn-sm"><RefreshCw size={14} /></button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Affiliate</th>
                  <th>Click ID</th>
                  <th>Order ID</th>
                  <th>Doanh thu</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {postbackLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs text-slate-500">#{log.id}</td>
                    <td>
                      <p className="font-mono text-xs text-brand-light">{log.affiliate_code}</p>
                      <p className="text-xs text-slate-400">{log.affiliate_name}</p>
                    </td>
                    <td className="font-mono text-xs text-slate-400">{log.click_id}</td>
                    <td className="font-mono text-xs">{log.order_id || '—'}</td>
                    <td className="font-bold text-emerald-400">
                      {new Intl.NumberFormat('vi-VN').format(log.revenue)}đ
                    </td>
                    <td>
                      <span className={`badge ${log.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(log.received_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
