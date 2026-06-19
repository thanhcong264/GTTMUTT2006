import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, TrendingUp, Users, RefreshCw, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 shadow-xl border border-brand/20 text-xs">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' && p.value > 1000
            ? new Intl.NumberFormat('vi-VN').format(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { api } = useAuth();
  const [affData, setAffData] = useState(null);
  const [attData, setAttData] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [aff, att] = await Promise.all([
        api.get(`/reports/affiliate?period=${period}`),
        api.get('/reports/attendance'),
      ]);
      setAffData(aff.data);
      setAttData(att.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period]);

  const formatVND = (v) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

  return (
    <Layout title="Báo cáo Analytics" subtitle="Phân tích hiệu suất Affiliate và chấm công nhân sự">
      {/* Controls */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 p-1 bg-surface-card rounded-xl border border-surface-border">
          {['7d', '30d', '90d'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p ? 'bg-brand text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {p}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-secondary btn-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Summary KPIs */}
      {affData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Tổng Clicks', val: affData.summary.total_clicks.toLocaleString(), icon: Activity, color: 'text-brand-light' },
            { label: 'Tổng Conversions', val: affData.summary.total_conversions.toLocaleString(), icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Avg CR', val: affData.summary.avg_cr + '%', icon: BarChart3, color: 'text-amber-400' },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand/10 border border-brand/20">
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className={`text-xl font-black ${color}`}>{val}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Clicks & CR Line Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-white mb-1 flex items-center gap-2">
            <Activity size={18} className="text-brand" /> Clicks & Conversion Rate
          </h3>
          <p className="text-xs text-slate-500 mb-4">Theo dõi realtime hiệu suất Affiliate</p>
          {loading ? <div className="skeleton h-56 rounded-xl" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={affData?.chart_data?.slice(-14)} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v.slice(5)} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(0)+'k' : v} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v+'%'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="left" type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2}
                    fill="url(#g1)" name="Clicks" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="cr" stroke="#10b981" strokeWidth={2.5}
                    name="CR (%)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Conversions Bar Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-white mb-1 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" /> Conversions theo ngày
          </h3>
          <p className="text-xs text-slate-500 mb-4">Số đơn hàng thành công ghi nhận qua Postback</p>
          {loading ? <div className="skeleton h-56 rounded-xl" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={affData?.chart_data?.slice(-14)} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="conversions" fill="#10b981" name="Conversions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Attendance Bar Chart */}
        <div className="card p-5">
          <h3 className="font-bold text-white mb-1 flex items-center gap-2">
            <Users size={18} className="text-blue-400" /> Thống kê chấm công nhân sự
          </h3>
          <p className="text-xs text-slate-500 mb-4">Ngày công, đi muộn, vắng mặt theo nhân viên</p>
          {loading ? <div className="skeleton h-56 rounded-xl" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attData?.bar_data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="employee" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v?.split(' ').pop()} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="present" fill="#6366f1" name="Đúng giờ" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="late" fill="#f59e0b" name="Đi muộn" radius={[0, 0, 0, 0]} stackId="a" />
                  <Bar dataKey="absent" fill="#ef4444" name="Vắng" radius={[0, 0, 4, 4]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Affiliates Revenue */}
        <div className="card p-5">
          <h3 className="font-bold text-white mb-1 flex items-center gap-2">
            <BarChart3 size={18} className="text-amber-400" /> Top Affiliate theo Doanh thu
          </h3>
          <p className="text-xs text-slate-500 mb-4">Ranking đối tác đóng góp cao nhất</p>
          {loading ? <div className="skeleton h-56 rounded-xl" /> : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={affData?.top_affiliates?.slice(0, 5).map(a => ({
                    name: a.full_name?.split(' ').slice(-1)[0],
                    revenue: Math.round(a.total_revenue / 1000000),
                    commission: Math.round(a.total_commission / 1000000),
                  }))}
                  margin={{ top: 5, right: 20, bottom: 0, left: 10 }}
                  barSize={18}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v + 'tr'} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Doanh thu (tr.đ)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="commission" fill="#f59e0b" name="Hoa hồng (tr.đ)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
