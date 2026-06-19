import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import {
  Users, Clock, Network, TrendingUp, CheckCircle, ArrowUp, ArrowDown,
  Activity, RefreshCw, Eye, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const ICON_MAP = {
  users: Users,
  clock: Clock,
  handshake: Network,
  'trending-up': TrendingUp,
  'check-circle': CheckCircle,
};

function StatCard({ kpi, index }) {
  const Icon = ICON_MAP[kpi.icon] || TrendingUp;
  const isPositive = kpi.change >= 0;
  const isPercent = kpi.unit === '%';

  const formatValue = (val) => {
    if (kpi.unit === 'đ') return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
    return val + (kpi.unit?.startsWith('/') ? kpi.unit : '');
  };

  const COLORS = [
    'from-violet-500/20 to-brand/20 border-brand/20 text-brand',
    'from-amber-500/20 to-orange-500/20 border-amber-500/20 text-amber-400',
    'from-emerald-500/20 to-teal-500/20 border-emerald-500/20 text-emerald-400',
    'from-blue-500/20 to-cyan-500/20 border-blue-500/20 text-blue-400',
    'from-pink-500/20 to-rose-500/20 border-pink-500/20 text-pink-400',
  ];

  return (
    <div className={`stat-card bg-gradient-to-br ${COLORS[index % 5].split(' ').slice(0,2).join(' ')} border ${COLORS[index % 5].split(' ')[2]} animate-slide-up`}
      style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">{kpi.label}</p>
          <p className="text-2xl font-black text-white mt-1">{formatValue(kpi.value)}</p>
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${COLORS[index % 5].split(' ').slice(0,2).join(' ')} ${COLORS[index % 5].split(' ')[2]} border`}>
          <Icon size={20} className={COLORS[index % 5].split(' ')[3]} />
        </div>
      </div>
      {kpi.change !== 0 && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{Math.abs(kpi.change)}{isPercent ? '%' : ''} so với tháng trước</span>
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 shadow-xl border border-brand/20">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000
            ? new Intl.NumberFormat('vi-VN').format(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { api, user } = useAuth();
  const [kpis, setKpis] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [attData, setAttData] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, affRes, wfRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/affiliate?period=' + period),
        api.get('/workflow?status=pending'),
      ]);
      setKpis(dashRes.data.kpis);
      setChartData(affRes.data.chart_data?.slice(-14) || []);
      setAffiliates(affRes.data.top_affiliates || []);
      setWorkflows(wfRes.data.workflows || []);

      const attRes = await api.get('/reports/attendance');
      setAttData(attRes.data.bar_data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period]);

  const formatVND = (val) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(val);

  return (
    <Layout title="Tổng quan Dashboard" subtitle={`Chào mừng trở lại, ${user?.full_name?.split(' ').pop()} 👋`}>
      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {loading
          ? Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
          : kpis.map((kpi, i) => <StatCard key={kpi.label} kpi={kpi} index={i} />)
        }
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Affiliate Line Chart */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white">Hiệu suất Affiliate</h3>
              <p className="text-xs text-slate-500">Clicks & Tỷ lệ chuyển đổi theo ngày</p>
            </div>
            <div className="flex gap-1">
              {['7d', '30d', '90d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(0) + 'k' : v} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v + '%'} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2}
                  fill="url(#colorClicks)" name="Clicks" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="cr" stroke="#10b981" strokeWidth={2}
                  name="CR (%)" dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Affiliates */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Top Đối Tác</h3>
            <Activity size={16} className="text-slate-500" />
          </div>
          <div className="space-y-3">
            {affiliates.slice(0, 4).map((aff, i) => (
              <div key={aff.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center text-xs font-bold text-brand-light flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{aff.full_name}</p>
                  <p className="text-xs text-slate-500">{aff.traffic_source}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{formatVND(aff.total_revenue)}đ</p>
                  <p className="text-xs text-slate-500">{aff.total_conversions} đơn</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Bar Chart + Pending Workflows */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white">Chấm Công Tháng Này</h3>
              <p className="text-xs text-slate-500">Thống kê ngày công theo nhân viên</p>
            </div>
            <button onClick={load} className="btn-ghost btn-sm">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attData.slice(0, 6)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="employee" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v.split(' ').pop()} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="present" fill="#6366f1" name="Đúng giờ" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#f59e0b" name="Đi muộn" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Vắng mặt" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Workflows */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white">Đơn Chờ Phê Duyệt</h3>
              <p className="text-xs text-slate-500">{workflows.length} đơn đang chờ xử lý</p>
            </div>
            <a href="/workflow" className="btn-ghost btn-sm text-brand-light">
              Xem tất cả <ChevronRight size={14} />
            </a>
          </div>
          <div className="space-y-2.5">
            {workflows.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">Không có đơn nào chờ duyệt ✓</div>
            ) : workflows.slice(0, 4).map((wf) => (
              <div key={wf.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated transition-colors">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  wf.priority === 'urgent' ? 'bg-red-500' :
                  wf.priority === 'high' ? 'bg-amber-500' : 'bg-brand'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-1">{wf.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {wf.type === 'leave_request' ? '🏖️ Nghỉ phép' : '💰 Hoa hồng'} •
                    Bước {wf.current_step}/{wf.total_steps}
                  </p>
                </div>
                <span className={`badge flex-shrink-0 ${
                  wf.priority === 'urgent' ? 'badge-danger' :
                  wf.priority === 'high' ? 'badge-warning' : 'badge-info'
                }`}>
                  {wf.priority === 'urgent' ? 'Khẩn' : wf.priority === 'high' ? 'Cao' : 'Bình thường'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
