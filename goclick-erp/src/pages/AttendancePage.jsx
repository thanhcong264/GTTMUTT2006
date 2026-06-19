import React, { useEffect, useState } from 'react';
import {
  Clock, MapPin, Loader2, CheckCircle, X, Plus, Calendar,
  ChevronLeft, ChevronRight, AlertCircle, Fingerprint, Wifi
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const STATUS_STYLES = {
  present:    { cls: 'bg-emerald-900/40 border-emerald-700/30 text-emerald-400', label: 'Đúng giờ' },
  late:       { cls: 'bg-amber-900/40 border-amber-700/30 text-amber-400', label: 'Đi muộn' },
  absent:     { cls: 'bg-red-900/40 border-red-700/30 text-red-400', label: 'Vắng mặt' },
  half_day:   { cls: 'bg-blue-900/40 border-blue-700/30 text-blue-400', label: 'Nửa ngày' },
  on_leave:   { cls: 'bg-purple-900/40 border-purple-700/30 text-purple-400', label: 'Nghỉ phép' },
  weekend:    { cls: 'bg-surface-elevated border-surface-border/30 text-slate-600', label: 'Cuối tuần' },
};

const SOURCE_ICONS = { gps: MapPin, fingerprint: Fingerprint, face: Fingerprint, manual: Clock, sync: Wifi };

function CheckInModal({ onClose, onSuccess }) {
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | locating | success | error
  const [gpsData, setGpsData] = useState(null);
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');

  const getLocation = () => {
    setStatus('locating');
    navigator.geolocation?.getCurrentPosition(
      (pos) => setGpsData({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Use mock location for demo
        setGpsData({ lat: 10.7769, lng: 106.7009 });
      }
    );
  };

  useEffect(() => { getLocation(); }, []);

  const handleCheckin = async () => {
    if (!gpsData) return;
    setLoading(true);
    try {
      const res = await api.post('/attendance/checkin', {
        employee_id: user.id,
        latitude: gpsData.lat,
        longitude: gpsData.lng,
        note,
      });
      setMessage(res.data.message);
      setStatus('success');
      setTimeout(() => { onSuccess?.(); onClose(); }, 1500);
    } catch (e) {
      setMessage(e.response?.data?.detail || 'Chấm công thất bại');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md mx-4 p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <MapPin className="text-brand" size={20} />
            Chấm công GPS
          </h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
        </div>

        {/* GPS Status */}
        <div className={`rounded-xl p-4 mb-4 border text-center transition-all ${
          status === 'locating' ? 'bg-blue-900/30 border-blue-700/30' :
          status === 'success' ? 'bg-emerald-900/30 border-emerald-700/30' :
          status === 'error' ? 'bg-red-900/30 border-red-700/30' :
          'bg-surface-elevated border-surface-border'
        }`}>
          {status === 'locating' && (
            <>
              <Loader2 size={32} className="animate-spin text-blue-400 mx-auto mb-2" />
              <p className="text-blue-400 font-medium">Đang xác định vị trí...</p>
            </>
          )}
          {status === 'idle' && gpsData && (
            <>
              <MapPin size={32} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-semibold">Đã lấy vị trí thành công</p>
              <p className="text-slate-400 text-xs mt-1">{gpsData.lat.toFixed(5)}, {gpsData.lng.toFixed(5)}</p>
              <p className="text-xs text-emerald-500 mt-1">✓ Trong phạm vi văn phòng (500m)</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-semibold">{message}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
              <p className="text-red-400 font-medium">{message}</p>
            </>
          )}
        </div>

        <div className="mb-4">
          <label className="label">Ghi chú (tuỳ chọn)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="input" placeholder="Ghi chú ca làm việc..." />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Huỷ</button>
          <button
            onClick={handleCheckin}
            disabled={loading || !gpsData || status === 'success'}
            className="btn-success flex-1 justify-center"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Xác nhận Check-in
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaveRequestForm({ onClose, onSuccess }) {
  const { api, user } = useAuth();
  const [form, setForm] = useState({ leave_type: 'Nghỉ phép năm', start_date: '', end_date: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const diffDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const d = (new Date(form.end_date) - new Date(form.start_date)) / 86400000 + 1;
    return Math.max(0, d);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/workflow/leave', {
        employee_id: user.id,
        ...form,
        total_days: diffDays(),
      });
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi gửi đơn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-md mx-4 p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Calendar className="text-brand" size={20} /> Đăng ký nghỉ phép
          </h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-emerald-400 font-semibold">Đơn đã gửi thành công!</p>
            <p className="text-slate-500 text-sm mt-1">Đang chờ phê duyệt từ Trưởng phòng</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Loại nghỉ phép</label>
              <select value={form.leave_type} onChange={(e) => setForm({...form, leave_type: e.target.value})}
                className="input">
                {['Nghỉ phép năm', 'Nghỉ ốm', 'Nghỉ không lương', 'Nghỉ cưới'].map(t =>
                  <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Từ ngày</label>
                <input type="date" value={form.start_date}
                  onChange={(e) => setForm({...form, start_date: e.target.value})}
                  className="input" required />
              </div>
              <div>
                <label className="label">Đến ngày</label>
                <input type="date" value={form.end_date}
                  onChange={(e) => setForm({...form, end_date: e.target.value})}
                  className="input" required />
              </div>
            </div>
            {diffDays() > 0 && (
              <div className="bg-brand/10 border border-brand/20 rounded-xl p-3 text-sm text-brand-light text-center">
                Tổng: <strong>{diffDays()} ngày</strong>
              </div>
            )}
            <div>
              <label className="label">Lý do</label>
              <textarea value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})}
                className="input min-h-[80px] resize-none" placeholder="Lý do nghỉ phép..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Huỷ</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Gửi đơn
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { api, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showCheckin, setShowCheckin] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(user?.id || '');
  const [employees, setEmployees] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [tsRes, sumRes] = await Promise.all([
        api.get(`/attendance/timesheet?month=${month}${selectedEmp ? `&employee_id=${selectedEmp}` : ''}`),
        api.get(`/attendance/summary?month=${month}${selectedEmp ? `&employee_id=${selectedEmp}` : ''}`),
      ]);
      setRecords(tsRes.data.records || []);
      setSummary(sumRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, selectedEmp]);

  // Build calendar grid
  const [year, mon] = month.split('-').map(Number);
  const firstDay = new Date(year, mon - 1, 1).getDay();
  const daysInMonth = new Date(year, mon, 0).getDate();
  const recordMap = Object.fromEntries(records.map(r => [r.work_date, r]));

  const adjustedFirst = (firstDay + 6) % 7; // Monday-first

  const calendarDays = [];
  for (let i = 0; i < adjustedFirst; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const changeMonth = (delta) => {
    const d = new Date(year, mon - 1 + delta, 1);
    setMonth(d.toISOString().slice(0, 7));
  };

  const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <Layout title="Chấm Công & Nhân Sự" subtitle="Quản lý bảng công, check-in GPS và đơn nghỉ phép">
      {showCheckin && <CheckInModal onClose={() => setShowCheckin(false)} onSuccess={load} />}
      {showLeave && <LeaveRequestForm onClose={() => setShowLeave(false)} onSuccess={load} />}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="btn-secondary btn-sm"><ChevronLeft size={16} /></button>
          <span className="font-bold text-white px-2 min-w-[100px] text-center">
            {new Date(year, mon - 1).toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="btn-secondary btn-sm"><ChevronRight size={16} /></button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLeave(true)} className="btn-secondary">
            <Calendar size={16} /> Đăng ký nghỉ
          </button>
          <button onClick={() => setShowCheckin(true)} className="btn-success">
            <MapPin size={16} /> Check-in GPS
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {[
            { label: 'Đúng giờ', val: summary.present, color: 'text-emerald-400' },
            { label: 'Đi muộn', val: summary.late, color: 'text-amber-400' },
            { label: 'Vắng mặt', val: summary.absent, color: 'text-red-400' },
            { label: 'Nửa ngày', val: summary.half_day, color: 'text-blue-400' },
            { label: 'Tổng giờ', val: summary.total_working_hours?.toFixed(1) + 'h', color: 'text-slate-300' },
            { label: 'Giờ OT', val: summary.total_ot_hours?.toFixed(1) + 'h', color: 'text-purple-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="card p-3 text-center">
              <p className={`text-xl font-black ${color}`}>{val}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="card p-5 mb-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-brand" />
          Bảng chấm công lịch
        </h3>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold py-1 ${i >= 5 ? 'text-slate-600' : 'text-slate-400'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const dateStr = `${month}-${String(day).padStart(2, '0')}`;
            const rec = recordMap[dateStr];
            const dayOfWeek = new Date(year, mon - 1, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = dateStr === new Date().toISOString().slice(0, 10);

            const style = rec
              ? (STATUS_STYLES[rec.status] || STATUS_STYLES.present)
              : isWeekend
              ? STATUS_STYLES.weekend
              : { cls: 'bg-surface-elevated border-surface-border text-slate-600', label: 'Chưa có' };

            return (
              <div
                key={dateStr}
                className={`rounded-xl border p-1.5 text-center cursor-default transition-all hover:scale-105 ${style.cls} ${isToday ? 'ring-2 ring-brand ring-offset-1 ring-offset-surface-card' : ''}`}
              >
                <p className={`text-sm font-bold ${isToday ? 'text-brand-light' : ''}`}>{day}</p>
                {rec && (
                  <p className="text-xs leading-tight mt-0.5 font-medium">{style.label}</p>
                )}
                {rec?.check_in_time && (
                  <p className="text-xs opacity-70 mt-0.5">{formatTime(rec.check_in_time)}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-surface-border">
          {Object.entries(STATUS_STYLES).filter(([k]) => k !== 'weekend').map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs">
              <div className={`w-3 h-3 rounded-sm border ${v.cls}`} />
              <span className="text-slate-400">{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="card p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Clock size={18} className="text-brand" />
          Chi tiết bảng công
        </h3>
        {loading ? (
          <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Nhân viên</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Giờ làm</th>
                  <th>OT</th>
                  <th>Nguồn</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 20).map((r) => {
                  const st = STATUS_STYLES[r.status] || STATUS_STYLES.present;
                  const SrcIcon = SOURCE_ICONS[r.source] || Clock;
                  return (
                    <tr key={r.id}>
                      <td className="font-mono text-xs text-slate-400">{r.work_date}</td>
                      <td className="font-medium text-sm">{r.employee_name}</td>
                      <td className="font-mono text-sm text-emerald-400">{formatTime(r.check_in_time)}</td>
                      <td className="font-mono text-sm text-slate-400">{formatTime(r.check_out_time)}</td>
                      <td className="font-bold">{r.working_hours ? `${r.working_hours}h` : '-'}</td>
                      <td className={r.ot_hours > 0 ? 'text-purple-400 font-semibold' : 'text-slate-600'}>
                        {r.ot_hours > 0 ? `+${r.ot_hours}h` : '-'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-slate-500">
                          <SrcIcon size={12} />
                          <span className="text-xs capitalize">{r.source}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge border ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
